# Extended Mode

Extended Mode provides the full VS Code experience in the browser by integrating the complete VS Code services stack with Monaco Editor. This mode unlocks advanced IDE features like workspace management, views, panels, and rich extension capabilities that go beyond basic language server integration.

## When to Use Extended Mode

Choose Extended Mode when you need:
- **Full IDE experience** with explorer, panels, status bars, and views
- **TextMate semantic highlighting** instead of basic Monarch syntax highlighting
- **Complete workspace management** with multi-file projects and workspace services
- **VS Code extension system** with language contributions and rich extensions
- **Advanced editor features** like integrated terminals, problem panels, and search
- **Complex language integrations** like Langium-based DSLs that require VS Code APIs

Extended Mode is essential for Langium language servers and applications that need VS Code-like IDE capabilities.

## Basic Extended Mode Setup

Here's a complete working example based on the project's actual implementation patterns:

```typescript
import { LogLevel } from '@codingame/monaco-vscode-api';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
import '@codingame/monaco-vscode-json-default-extension';
import { EditorApp } from 'monaco-languageclient/editorApp';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { LanguageClientWrapper, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { defaultHtmlAugmentationInstructions, defaultViewsInit } from 'monaco-languageclient/vscodeApiWrapper';
import * as vscode from 'vscode';

async function createExtendedEditor() {
    // Configure VS Code API with extended mode
    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended', // Key difference from classic mode
        htmlContainer: document.getElementById('monaco-editor-root')!,
        logLevel: LogLevel.Debug,
        
        // Service overrides for extended functionality
        serviceOverrides: {
            ...getKeybindingsServiceOverride(),
            ...getLifecycleServiceOverride()
        },
        
        // Views configuration for IDE-like interface
        viewsConfig: {
            viewServiceType: 'ViewsService',
            htmlAugmentationInstructions: defaultHtmlAugmentationInstructions,
            viewsInitFunc: defaultViewsInit
        },
        
        // User configuration
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern',
                'editor.guides.bracketPairsHorizontal': 'active',
                'editor.wordBasedSuggestions': 'off',
                'editor.experimental.asyncTokenization': true
            })
        },
        
        monacoWorkerFactory: configureDefaultWorkerFactory
    };

    // Initialize VS Code API wrapper
    const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await apiWrapper.init();

    // Configure language client
    const languageClientConfig: LanguageClientConfig = {
        clientOptions: {
            documentSelector: ['json'],
            workspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: vscode.Uri.file('/workspace')
            }
        },
        connection: {
            options: {
                $type: 'WebSocketUrl',
                url: 'ws://localhost:30000/sampleServer'
            }
        }
    };

    // Initialize language client
    const lcWrapper = new LanguageClientWrapper(languageClientConfig, apiWrapper.getLogger());
    await lcWrapper.start();

    // Create editor app
    const editorApp = new EditorApp({
        $type: 'extended',
        codeResources: {
            main: {
                text: '{\n  "name": "example",\n  "version": "1.0.0"\n}',
                uri: '/workspace/package.json'
            }
        }
    });

    await editorApp.start(vscodeApiConfig.htmlContainer!);
    console.log('Extended mode editor ready!');
}

createExtendedEditor().catch(console.error);
```

## Service Overrides

Extended Mode's power comes from VS Code service overrides. You can customize behavior by overriding specific services:

### Theme and Keybindings
```typescript
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';

const vscodeApiConfig = {
    $type: 'extended',
    htmlContainer: document.getElementById('editor')!,

    serviceOverrides: {
        ...getKeybindingsServiceOverride(),
        ...getThemeServiceOverride()
    }
};
```

### Language Services
```typescript
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override';
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override';

const vscodeApiConfig = {
    serviceOverrides: {
        ...getLanguagesServiceOverride(),
        ...getTextmateServiceOverride()
    }
};
```

### File System Services
```typescript
import getFileServiceOverride from '@codingame/monaco-vscode-files-service-override';

const vscodeApiConfig = {
    serviceOverrides: {
        ...getFileServiceOverride()
    }
};
```

## Advanced Configuration

### Multiple Workspaces

```typescript
const languageClientConfig: LanguageClientConfig = {
    clientOptions: {
        documentSelector: ['typescript'],
        workspaceFolder: [
            { index: 0, name: 'main-project', uri: vscode.Uri.file('/workspace/main') },
            { index: 1, name: 'shared-lib', uri: vscode.Uri.file('/workspace/lib') }
        ]
    },
    connection: {
        options: {
            $type: 'WebSocketUrl',
            url: 'ws://localhost:30000/typescript'
        }
    }
};
```

### Custom Commands and Keybindings

```typescript
// Register custom commands
vscode.commands.registerCommand('myextension.sayHello', () => {
    vscode.window.showInformationMessage('Hello from Extended Mode!');
});

// User configuration with custom keybindings
userConfiguration: {
    json: JSON.stringify({
        'keybindings': [
            {
                'key': 'ctrl+shift+h',
                'command': 'myextension.sayHello'
            }
        ]
    })
}
```

### Extension Integration

Extended Mode can also work with VS Code extension APIs:

```typescript
// Access VS Code API features
const activeEditor = vscode.window.activeTextEditor;
if (activeEditor) {
    const document = activeEditor.document;
    const selection = activeEditor.selection;

    // Use VS Code APIs
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.replace(document.uri, selection, 'New text');
    await vscode.workspace.applyEdit(workspaceEdit);
}
```

## File System Integration

Extended Mode provides rich file system integration, allowing you to manage files and directories in a straightforward fashion:

```typescript
import { RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';

// Set up in-memory file system
const fileSystemProvider = new RegisteredFileSystemProvider(false);

// Add multiple files
const files = [
    { path: '/workspace/src/main.ts', content: 'console.log("Main file");' },
    { path: '/workspace/src/utils.ts', content: 'export const helper = () => {};' },
    { path: '/workspace/package.json', content: '{"name": "my-project"}' }
];

files.forEach(file => {
    const uri = vscode.Uri.file(file.path);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(uri, file.content));
});

registerFileSystemOverlay(1, fileSystemProvider);
```

## Multi-Language Support

Extended Mode also supports handling more than one language, when you need it:

```typescript
// Import language extensions
import '@codingame/monaco-vscode-typescript-language-features-default-extension';
import '@codingame/monaco-vscode-json-default-extension';
import '@codingame/monaco-vscode-python-default-extension';

// Configure multiple language clients
const clients: LanguageClientConfig[] = [
    {
        name: 'TypeScript Language Server',
        connection: { 
            options: { $type: 'WebSocketUrl', url: 'ws://localhost:3001/typescript' }
        },
        clientOptions: { 
            documentSelector: ['typescript', 'javascript'],
            workspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: vscode.Uri.file('/workspace')
            }
        }
    },
    {
        name: 'JSON Language Server',
        connection: { 
            options: { $type: 'WebSocketUrl', url: 'ws://localhost:3002/json' }
        },
        clientOptions: { 
            documentSelector: ['json'],
            workspaceFolder: {
                index: 0,
                name: 'workspace', 
                uri: vscode.Uri.file('/workspace')
            }
        }
    },
    {
        name: 'Python Language Server',
        connection: { 
            options: { $type: 'WebSocketUrl', url: 'ws://localhost:3003/python' }
        },
        clientOptions: { 
            documentSelector: ['python'],
            workspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: vscode.Uri.file('/workspace')
            }
        }
    }
];

// Initialize all clients
await Promise.all(clients.map(config => {
    const wrapper = new LanguageClientWrapper(config, apiWrapper.getLogger());
    return wrapper.start();
}));
```

## Integration with Build Tools

Working with build tools like Vite or Webpack requires some configuration to ensure workers and VS Code services function correctly.

### Vite Configuration

For vite users, ensure you deduplicate the `vscode` package and set the worker format:

```typescript
// vite.config.ts
export default defineConfig({
    resolve: {
        dedupe: ['vscode']
    },
    worker: {
        format: 'es'
    }
});
```

### Webpack Configuration
See the [webpack troubleshooting guide](../guides/troubleshooting.md#webpack-worker-issues) for Extended Mode configuration.

## Common Patterns

### Editor Lifecycle Management

Consider how you manage the lifecycle of your editor, language client, and VS Code API wrapper. All of these take up resources and should be tracked & disposed of properly.

For example, having a manager class to encapsulate initialization and disposal is one way to handle this:

```typescript
class ExtendedEditorManager {
    private apiWrapper?: MonacoVscodeApiWrapper;
    private lcWrapper?: LanguageClientWrapper;
    private editorApp?: EditorApp;

    async initialize(vscodeApiConfig: MonacoVscodeApiConfig, languageClientConfig: LanguageClientConfig, editorConfig: any) {
        // Initialize VS Code API wrapper
        this.apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
        await this.apiWrapper.init();

        // Initialize language client
        this.lcWrapper = new LanguageClientWrapper(languageClientConfig, this.apiWrapper.getLogger());
        await this.lcWrapper.start();

        // Initialize editor app
        this.editorApp = new EditorApp(editorConfig);
        await this.editorApp.start(vscodeApiConfig.htmlContainer!);
    }

    async dispose() {
        await this.editorApp?.dispose();
        await this.lcWrapper?.dispose();
        await this.apiWrapper?.dispose();
    }
}
```

### Error Handling

It's easy to run into issues during initialization and lose errors due to async operations. Don't forget to wrap initialization logic in try/catch blocks to handle errors gracefully:

```typescript
try {
    await apiWrapper.init();
    await lcWrapper.start();
    await editorApp.start(vscodeApiConfig.htmlContainer!);
} catch (error) {
    console.error('Failed to initialize Extended Mode:', error);
    // Fallback to Classic Mode or show error message
}
```

If you're using promises, consider using `.catch()` to handle explicitly errors at each step.

In either case, proper error handling will help you diagnose issues quickly later on.

## Troubleshooting

### Common Issues

**Service conflicts**: Ensure service overrides don't conflict with each other
**Memory usage**: Extended Mode uses more memory than Classic Mode
**Bundle size**: Include only needed VS Code services to reduce bundle size
**Worker loading**: Configure workers properly for your build system

### Debug Configuration

Lastly, don't forget to enable detailed logging during development to help catch issues early on:

```typescript
const vscodeApiConfig = {
    logLevel: LogLevel.Debug, // Enable detailed logging
    // ...
};
```

## Examples in This Project

The project includes comprehensive Extended Mode examples:

### Python Language Server (`packages/examples/python.html`)
**Location**: `packages/examples/src/python/`
**Description**: Full-featured Python development environment with Pyright language server, debugger support, and file explorer

### Langium Examples
**Locations**: 
- `packages/examples/langium_extended.html` - Langium grammar editing
- `packages/examples/statemachine.html` - Custom state machine DSL

```bash
# Run the examples
npm run dev
# Visit http://localhost:20001/python.html
# Visit http://localhost:20001/langium_extended.html
```

## Next Steps

- Compare with [Classic Mode](./classic-mode.md) to understand the differences
- Learn about [Langium Integration](./extended-mode-with-langium.md) for custom DSL language servers
- Explore [WebSocket Communication](./websockets.md) for external language servers
- Try [Web Workers](./web-workers.md) for in-browser language servers
- Check [Examples](../examples/index.md) for complete implementations

Extended Mode provides the full power of VS Code in the browser, making it ideal for rich IDE experiences and complex language integrations.

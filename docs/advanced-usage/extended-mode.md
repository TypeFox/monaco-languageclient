# Extended Mode

Extended Mode provides the richest Monaco Language Client experience by integrating VS Code services and functionality. This mode gives you access to advanced editor features, themes, keybindings, and extension-like capabilities.

## When to Use Extended Mode

Choose Extended Mode when you need:
- **VS Code-like functionality** in your web application
- **Rich editor services** (themes, keybindings, commands)
- **Multiple language support** with full language server integration
- **Extension-like capabilities** without full VS Code
- **Advanced features** like integrated terminal, file explorer, etc.

## Basic Extended Mode Setup

Here's a complete example of Extended Mode configuration:

```typescript
import '@codingame/monaco-vscode-json-default-extension';
import { EditorApp } from 'monaco-languageclient/editorApp';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import * as vscode from 'vscode';
import { LogLevel } from '@codingame/monaco-vscode-api';

async function createExtendedEditor() {
    // Configure VS Code API wrapper
    const vscodeApiConfig = {
        $type: 'extended' as const,
        htmlContainer: document.getElementById('monaco-editor-root')!,
        logLevel: LogLevel.Info,
        
        // VS Code-style user configuration
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern',
                'editor.fontSize': 14,
                'editor.tabSize': 2,
                'editor.wordWrap': 'on',
                'editor.minimap.enabled': true,
                'editor.bracketPairColorization.enabled': true,
                'editor.guides.bracketPairsHorizontal': 'active'
            })
        },
        
        monacoWorkerFactory: configureDefaultWorkerFactory
    };
    
    // Initialize VS Code API
    const wrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await wrapper.init();
    
    // Configure language client
    const languageClientConfig = {
        connection: {
            options: {
                $type: 'WebSocketUrl' as const,
                url: 'ws://localhost:30000/sampleServer'
            }
        },
        clientOptions: {
            documentSelector: ['json'],
            workspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: vscode.Uri.file('/workspace')
            }
        }
    };
    
    // Initialize language client
    const lcWrapper = new LanguageClientWrapper();
    await lcWrapper.init(languageClientConfig);
    
    // Create editor app
    const editorApp = new EditorApp({
        codeResources: {
            main: {
                text: '{\n  "name": "example",\n  "version": "1.0.0"\n}',
                uri: '/workspace/package.json',
                fileExt: 'json'
            }
        }
    });
    
    await editorApp.init(wrapper);
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
const languageClientConfig = {
    clientOptions: {
        workspaceFolder: [
            { index: 0, name: 'main-project', uri: vscode.Uri.file('/workspace/main') },
            { index: 1, name: 'shared-lib', uri: vscode.Uri.file('/workspace/lib') }
        ]
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

Extended Mode can work with VS Code extension APIs:

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

Extended Mode provides rich file system integration:

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

Extended Mode excels at handling multiple languages:

```typescript
// Import language extensions
import '@codingame/monaco-vscode-typescript-language-features-default-extension';
import '@codingame/monaco-vscode-json-default-extension';
import '@codingame/monaco-vscode-python-default-extension';

// Configure multiple language clients
const clients = [
    {
        name: 'TypeScript',
        connection: { options: { $type: 'WebSocketUrl', url: 'ws://localhost:3001/typescript' }},
        clientOptions: { documentSelector: ['typescript', 'javascript'] }
    },
    {
        name: 'JSON',
        connection: { options: { $type: 'WebSocketUrl', url: 'ws://localhost:3002/json' }},
        clientOptions: { documentSelector: ['json'] }
    },
    {
        name: 'Python',
        connection: { options: { $type: 'WebSocketUrl', url: 'ws://localhost:3003/python' }},
        clientOptions: { documentSelector: ['python'] }
    }
];

// Initialize all clients
await Promise.all(clients.map(config => {
    const wrapper = new LanguageClientWrapper();
    return wrapper.init(config);
}));
```

## Performance Considerations

Extended Mode provides more features but requires careful performance management:

### Worker Configuration
```typescript
monacoWorkerFactory: configureDefaultWorkerFactory({
    // Optimize worker loading
    workerLoaders: {
        'TextEditorWorker': () => new Worker('./custom-editor-worker.js'),
        'TextMateWorker': () => new Worker('./custom-textmate-worker.js')
    }
})
```

### Lazy Service Loading
```typescript
// Only load services when needed
const vscodeApiConfig = {
    serviceOverrides: {
        // Load theme service only when themes are used
        ...getThemeServiceOverride()
    }
};
```

## Integration with Build Tools

### Vite Configuration
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
```typescript
class ExtendedEditorManager {
    private wrapper?: MonacoVscodeApiWrapper;
    private lcWrapper?: LanguageClientWrapper;
    private editorApp?: EditorApp;
    
    async initialize() {
        this.wrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
        await this.wrapper.init();
        
        this.lcWrapper = new LanguageClientWrapper();
        await this.lcWrapper.init(languageClientConfig);
        
        this.editorApp = new EditorApp(editorConfig);
        await this.editorApp.init(this.wrapper);
    }
    
    async dispose() {
        await this.editorApp?.dispose();
        await this.lcWrapper?.dispose();
        await this.wrapper?.dispose();
    }
}
```

### Error Handling
```typescript
try {
    await wrapper.init();
    await lcWrapper.init(languageClientConfig);
} catch (error) {
    console.error('Failed to initialize Extended Mode:', error);
    // Fallback to Classic Mode or show error message
}
```

## Troubleshooting

### Common Issues

**Service conflicts**: Ensure service overrides don't conflict with each other
**Memory usage**: Extended Mode uses more memory than Classic Mode
**Bundle size**: Include only needed VS Code services to reduce bundle size
**Worker loading**: Configure workers properly for your build system

### Debug Configuration
```typescript
const vscodeApiConfig = {
    logLevel: LogLevel.Debug, // Enable detailed logging
    // ... other config
};
```

## Next Steps

- **Learn about [Web Workers](web-workers.md)** for in-browser language servers
- **Explore [WebSocket Communication](websockets.md)** for external language servers  
- **Try [React Integration](react-integration.md)** for React applications
- **See [Examples](../examples/index.md)** for complete implementations
- **Check [Performance Guide](../guides/performance.md)** for optimization tips
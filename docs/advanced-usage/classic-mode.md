# Classic Mode

Classic Mode provides a streamlined language server integration using the Monaco Editor with a simplified VS Code service configuration. While still built on the VS Code API wrapper foundation, it offers reduced complexity and focuses on core language server features without advanced IDE capabilities.

## When to Use Classic Mode

Choose Classic Mode when you need:
- **Simplified setup** with fewer service dependencies
- **Core language features** (completions, diagnostics, hover) without advanced IDE features
- **Monarch syntax highlighting** instead of TextMate semantic highlighting
- **Focused integration** without workspace services, views, or complex UI elements
- **Lighter configuration** while maintaining language server capabilities

## Classic vs Extended Mode

| Feature | Classic Mode | Extended Mode |
|---------|-------------|--------------|
| Highlighting | Monarch | TextMate |
| Services | Basic editor services | Full VS Code service stack |
| Views/UI | Editor only | Explorer, panels, status bar, etc. |
| Workspace | Limited workspace support | Full workspace awareness |
| Extensions | Basic language registration | Rich extension system |
| Setup Complexity | Moderate | Complex |
| Use Case | Language server integration | Full IDE experience |

## Basic Classic Mode Setup

Here's a complete working example based on the project's JSON language server:

```typescript
import { LogLevel } from '@codingame/monaco-vscode-api';
import * as monaco from '@codingame/monaco-vscode-editor-api';
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import '@codingame/monaco-vscode-json-default-extension';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { LanguageClientWrapper, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';

// 1. Configure the VS Code API in classic mode
const vscodeApiConfig: MonacoVscodeApiConfig = {
    $type: 'classic', // This is the key difference from extended mode
    logLevel: LogLevel.Debug,
    serviceOverrides: {
        ...getTextmateServiceOverride(),
        ...getThemeServiceOverride()
    },
    userConfiguration: {
        json: JSON.stringify({
            'editor.experimental.asyncTokenization': true
        })
    },
    monacoWorkerFactory: configureDefaultWorkerFactory
};

// 2. Initialize the VS Code API wrapper
const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
await apiWrapper.init();

// 3. Register the language with Monaco
monaco.languages.register({
    id: 'json',
    extensions: ['.json', '.jsonc'],
    aliases: ['JSON', 'json'],
    mimetypes: ['application/json']
});

// 4. Create the Monaco editor
const htmlContainer = document.getElementById('monaco-editor-root')!;
monaco.editor.create(htmlContainer, {
    value: `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": "unix"
}`,
    language: 'json',
    automaticLayout: true,
    wordBasedSuggestions: 'off'
});

// 5. Configure the language client
const languageClientConfig: LanguageClientConfig = {
    clientOptions: {
        documentSelector: ['json']
    },
    connection: {
        options: {
            $type: 'WebSocketUrl',
            url: 'ws://localhost:30000/sampleServer'
        }
    }
};

// 6. Start the language client
const languageClientWrapper = new LanguageClientWrapper(
    languageClientConfig,
    apiWrapper.getLogger()
);
await languageClientWrapper.start();
```

## Connection Options

The project supports three connection types for language servers:

### WebSocket URL Connection
```typescript
const languageClientConfig: LanguageClientConfig = {
    clientOptions: {
        documentSelector: ['json']
    },
    connection: {
        options: {
            $type: 'WebSocketUrl',
            url: 'ws://localhost:30000/sampleServer'
        }
    }
};
```

### Direct WebSocket Connection

As an example, here's how to connect to a Python Pyright server with custom commands:

```typescript
import { WebSocketMessageReader, WebSocketMessageWriter, toSocket } from 'vscode-ws-jsonrpc';
import { createUrl } from 'monaco-languageclient/common';

const url = createUrl({
    secured: false,
    host: 'localhost',
    port: 30001,
    path: 'pyright',
    extraParams: {
        authorization: 'UserAuth'
    }
});

const webSocket = new WebSocket(url);
const iWebSocket = toSocket(webSocket);
const reader = new WebSocketMessageReader(iWebSocket);
const writer = new WebSocketMessageWriter(iWebSocket);

const languageClientConfig: LanguageClientConfig = {
    connection: {
        options: {
            $type: 'WebSocketDirect',
            webSocket: webSocket,
            startOptions: {
                onCall: (languageClient) => {
                    // Register custom commands after client starts
                    setTimeout(() => {
                        ['pyright.restartserver', 'pyright.organizeimports'].forEach((cmdName) => {
                            vscode.commands.registerCommand(cmdName, (...args: unknown[]) => {
                                languageClient?.sendRequest('workspace/executeCommand', {
                                    command: cmdName,
                                    arguments: args
                                });
                            });
                        });
                    }, 250);
                },
                reportStatus: true,
            }
        },
        messageTransports: { reader, writer }
    }
};
```

### Web Worker Connection

You can also run the language server in a Web Worker, much like in extended mode:

```typescript
const languageClientConfig: LanguageClientConfig = {
    connection: {
        options: {
            $type: 'WorkerDirect',
            worker: new Worker('./language-server-worker.js', { type: 'module' })
        }
    }
};
```

## Advanced Configuration

### Custom Service Overrides

Similar to extended mode, you can also add custom service overrides.

```typescript
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';

const vscodeApiConfig: MonacoVscodeApiConfig = {
    $type: 'classic',
    serviceOverrides: {
        ...getTextmateServiceOverride(),
        ...getThemeServiceOverride(),
        ...getKeybindingsServiceOverride(),
        ...getLifecycleServiceOverride()
    },
    // ... other config
};
```

### Language Registration with Extensions
```typescript
import '@codingame/monaco-vscode-json-default-extension';
import '@codingame/monaco-vscode-python-default-extension';

// The extensions provide language definitions and basic features
// Register the language ID for your language client
monaco.languages.register({
    id: 'python',
    extensions: ['.py', '.pyi'],
    aliases: ['Python', 'python'],
    mimetypes: ['text/x-python']
});
```

### User Configuration
```typescript
const vscodeApiConfig: MonacoVscodeApiConfig = {
    $type: 'classic',
    userConfiguration: {
        json: JSON.stringify({
            'workbench.colorTheme': 'Default Dark Modern',
            'editor.guides.bracketPairsHorizontal': 'active',
            'editor.wordBasedSuggestions': 'off',
            'editor.experimental.asyncTokenization': true
        })
    },
    // ... other config
};
```

## Working with Files

### In-Memory File System
```typescript
import { RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';
import * as vscode from 'vscode';

// Create file system provider
const fileSystemProvider = new RegisteredFileSystemProvider(false);

// Register files in memory
const files = new Map();
const helloPyPath = '/workspace/hello.py';
const helloPyCode = 'print("Hello, World!")';

files.set('hello.py', {
    code: helloPyCode,
    path: helloPyPath,
    uri: vscode.Uri.file(helloPyPath)
});

// Register the file
fileSystemProvider.registerFile(
    new RegisteredMemoryFile(files.get('hello.py')!.uri, helloPyCode)
);

// Register the file system overlay
registerFileSystemOverlay(1, fileSystemProvider);
```

### Workspace Configuration
```typescript
const languageClientConfig: LanguageClientConfig = {
    clientOptions: {
        documentSelector: ['python'],
        workspaceFolder: {
            index: 0,
            name: 'workspace',
            uri: vscode.Uri.parse('/workspace')
        }
    }
    // ... connection config
};
```

## Monaco Editor Integration

Classic mode gives you direct access to the Monaco editor API:

```typescript
// Create editor with custom configuration
const editor = monaco.editor.create(htmlContainer, {
    value: initialContent,
    language: 'json',
    theme: 'vs-dark',
    automaticLayout: true,
    wordWrap: 'on',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    quickSuggestions: true,
    parameterHints: { enabled: true },
    hover: { enabled: true }
});

// Listen to content changes
editor.onDidChangeModelContent(() => {
    console.log('Editor content changed');
});

// Access editor state
const model = editor.getModel();
const value = model?.getValue();
const position = editor.getPosition();

// Programmatic content updates
editor.setValue('{ "new": "content" }');
editor.setPosition({ lineNumber: 1, column: 1 });

// Add custom keybindings
editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    console.log('Save requested');
    // Implement save logic
});
```

## Examples in This Project

The project includes working Classic Mode examples:

### Bare Client (`packages/examples/bare.html`)
**Location**: `packages/examples/src/bare/client.ts`
**Description**: Minimal JSON language client setup demonstrating core Classic Mode patterns

```bash
# Run the example
npm run dev
# Visit http://localhost:20001/bare.html
```

### Python Language Server (Extended Mode)
**Location**: `packages/examples/src/python/`
**Note**: While this example uses extended mode (`$type: 'extended'`), it demonstrates the same foundational patterns used in classic mode with additional services.

## Key Differences from Standard Monaco

Unlike vanilla Monaco Editor, this project's Classic Mode:

- **Requires VS Code API Wrapper**: Always needs `MonacoVscodeApiWrapper` initialization
- **Uses VS Code Editor API**: Imports from `@codingame/monaco-vscode-editor-api`, not `monaco-editor`
- **Language Client Wrapper**: Uses `LanguageClientWrapper` instead of direct language client instantiation
- **Service Configuration**: Requires worker factory and service overrides
- **Extension Integration**: Uses VS Code extension system for language definitions

## Troubleshooting

### Common Issues

**Language features not working**:
- Verify WebSocket connection is established
- Check document selector matches your language ID
- Ensure language server is running and accessible

**Import errors**:
- Use `@codingame/monaco-vscode-editor-api` instead of `monaco-editor`
- Import service overrides from correct packages

**Worker factory errors**:
- Always include `configureDefaultWorkerFactory` in configuration
- Ensure worker factory is configured before API wrapper initialization

### Debugging

```typescript
const vscodeApiConfig: MonacoVscodeApiConfig = {
    $type: 'classic',
    logLevel: LogLevel.Debug, // Enable detailed logging
    // ... other config
};

// Access logger for debugging
const logger = apiWrapper.getLogger();
logger.info('Classic mode initialized');
```

## Next Steps

- Compare with [Extended Mode](./extended-mode.md) for advanced IDE features
- Explore [WebSocket Communication](./websockets.md) for external language servers
- Try [Langium Integration](./extended-mode-with-langium.md) for custom DSL language servers
- Check [Examples](../examples/index.md) for complete implementations

Classic mode provides a balanced approach between Monaco Editor simplicity and language server integration, making it ideal for applications that need rich language features without full IDE complexity.

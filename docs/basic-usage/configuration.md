# Configuration

This guide covers the essential configuration options for Monaco Language Client. We'll explore both Extended and Classic modes, and show you how to customize the editor behavior.

## Configuration Structure

Monaco Language Client uses a layered configuration approach:

1. **VS Code API Configuration** - Controls editor services and behavior
2. **Language Client Configuration** - Manages connection to language servers
3. **Editor App Configuration** - Defines code resources and editor setup

## Extended Mode Configuration

Extended Mode provides the richest feature set by leveraging VS Code services.

### Basic Extended Configuration

```typescript
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';

const vscodeApiConfig = {
    $type: 'extended' as const,
    htmlContainer: document.getElementById('editor')!,
    logLevel: LogLevel.Info,
    
    // User settings (like VS Code settings.json)
    userConfiguration: {
        json: JSON.stringify({
            'workbench.colorTheme': 'Default Dark Modern',
            'editor.fontSize': 14,
            'editor.tabSize': 2,
            'editor.wordWrap': 'on',
            'editor.minimap.enabled': false
        })
    },
    
    // Worker configuration for Monaco services
    monacoWorkerFactory: configureDefaultWorkerFactory
};
```

### Service Overrides

You can override VS Code services to customize behavior:

```typescript
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';

const vscodeApiConfig = {
    $type: 'extended' as const,
    htmlContainer: document.getElementById('editor')!,
    
    // Override specific services
    serviceOverrides: {
        ...getKeybindingsServiceOverride(),
        ...getThemeServiceOverride()
    }
};
```

### Language Client Configuration

Configure how the editor connects to language servers:

```typescript
const languageClientConfig = {
    connection: {
        options: {
            // WebSocket connection to external server
            $type: 'WebSocketUrl' as const,
            url: 'ws://localhost:3000/languageserver',
            startOptions: {
                onCall: () => console.log('Language server connected'),
                reportStatus: true
            }
        }
    },
    
    clientOptions: {
        // Which files this language server handles
        documentSelector: ['typescript', 'javascript'],
        
        // Workspace configuration
        workspaceFolder: {
            index: 0,
            name: 'my-project',
            uri: vscode.Uri.file('/workspace')
        },
        
        // Custom initialization options for the language server
        initializationOptions: {
            preferences: {
                includeCompletionsForModuleExports: true
            }
        }
    }
};
```

## Classic Mode Configuration

Classic Mode uses the standard Monaco Editor with language client features added:

```typescript
import { MonacoLanguageClient } from 'monaco-languageclient';
import { CloseAction, ErrorAction } from 'vscode-languageclient';
import * as monaco from 'monaco-editor';

// Create Monaco editor
const editor = monaco.editor.create(document.getElementById('container')!, {
    value: 'console.log("Hello, World!");',
    language: 'javascript',
    theme: 'vs-dark'
});

// Configure language client
const client = new MonacoLanguageClient({
    name: 'JavaScript Language Client',
    clientOptions: {
        documentSelector: ['javascript'],
        errorHandler: {
            error: () => ({ action: ErrorAction.Continue }),
            closed: () => ({ action: CloseAction.DoNotRestart })
        }
    },
    connection: {
        options: {
            $type: 'WebSocketUrl',
            url: 'ws://localhost:3001/javascript'
        }
    }
});

await client.start();
```

## Common Configuration Options

### Editor Settings

Configure Monaco Editor behavior through user configuration:

```typescript
userConfiguration: {
    json: JSON.stringify({
        // Editor appearance
        'workbench.colorTheme': 'Default Dark Modern',
        'editor.fontSize': 14,
        'editor.fontFamily': 'Consolas, monospace',
        
        // Editor behavior  
        'editor.tabSize': 2,
        'editor.wordWrap': 'on',
        'editor.minimap.enabled': true,
        'editor.lineNumbers': 'on',
        
        // Language features
        'editor.quickSuggestions': true,
        'editor.wordBasedSuggestions': 'off',
        'editor.parameterHints.enabled': true,
        
        // Advanced features
        'editor.experimental.asyncTokenization': true,
        'editor.guides.bracketPairsHorizontal': 'active'
    })
}
```

### File System Configuration

Set up in-memory or remote file systems:

```typescript
import { RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';

// In-memory file system
const fileSystemProvider = new RegisteredFileSystemProvider(false);
fileSystemProvider.registerFile(new RegisteredMemoryFile(
    vscode.Uri.file('/project/main.ts'),
    'console.log("Hello from TypeScript");'
));
registerFileSystemOverlay(1, fileSystemProvider);
```

### Connection Types

Different ways to connect to language servers:

#### WebSocket Connection
```typescript
connection: {
    options: {
        $type: 'WebSocketUrl',
        url: 'ws://localhost:3000/languageserver'
    }
}
```

#### Web Worker Connection
```typescript
connection: {
    options: {
        $type: 'WorkerConfig',
        worker: new Worker('./language-server.js', { type: 'module' })
    }
}
```

#### Message Channel (for complex worker setups)
```typescript
const channel = new MessageChannel();
const reader = new BrowserMessageReader(channel.port1);
const writer = new BrowserMessageWriter(channel.port1);

connection: {
    options: {
        $type: 'MessageChannel',
        reader,
        writer
    }
}
```

## Environment-Specific Configuration

### Development vs Production

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

const config = {
    logLevel: isDevelopment ? LogLevel.Debug : LogLevel.Error,
    userConfiguration: {
        json: JSON.stringify({
            'editor.wordBasedSuggestions': isDevelopment ? 'on' : 'off'
        })
    }
};
```

### Multiple Language Servers

You can configure multiple language clients for different file types:

```typescript
// TypeScript language client
const tsConfig = {
    connection: { options: { $type: 'WebSocketUrl', url: 'ws://localhost:3001/typescript' }},
    clientOptions: { documentSelector: ['typescript'] }
};

// JSON language client  
const jsonConfig = {
    connection: { options: { $type: 'WebSocketUrl', url: 'ws://localhost:3002/json' }},
    clientOptions: { documentSelector: ['json'] }
};

// Initialize both
await Promise.all([
    new LanguageClientWrapper().init(tsConfig),
    new LanguageClientWrapper().init(jsonConfig)
]);
```

## Configuration Validation

The configuration is validated at runtime. Common validation errors:

- **Missing htmlContainer**: Must provide a DOM element for Extended Mode
- **Invalid connection type**: Must specify valid `$type` for connections
- **Missing document selector**: Language clients need to know which files to handle

## Next Steps

- **See [Examples](examples.md)** for complete configuration examples
- **Learn [Extended Mode](../advanced-usage/extended-mode.md)** for advanced VS Code features
- **Explore [WebSocket Communication](../advanced-usage/websockets.md)** for external language servers
- **Check [Troubleshooting](../guides/troubleshooting.md)** for configuration issues
# Configuration

This guide covers important configuration options for `monaco-languageclient`. We'll explore both Extended and Classic modes, and show you how to customize the editor's behavior.

## Configuration Structure

The Monaco Language Client uses a layered configuration approach:

1. **VSCode API Configuration** - Controls editor services and behavior
2. **Language Client Configuration** - Manages connection to language servers
3. **Editor App Configuration** - Defines code resources and editor setup

## Monaco VSCode API Config

Independent of the type of configuration (`classic` or `extendend`), you have to configure and start the `MonacoVscodeApiWrapper` first. The most minimal comnfiguration you can apply is this:

```typescript
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';

const vscodeApiConfig: MonacoVscodeApiConfig = {
    $type: 'extended',
    viewsConfig: {
        $type: 'EditorService',
        htmlContainer: document.getElementById('my-editor-dom-element')!
    }
};

const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
await apiWrapper.start();
```

## Extended Mode Configuration

Extended Mode provides a rich feature set by leveraging VSCode services. This is generally the recommended mode for most applications. If you use extended mode, `MonacoVscodeApiWrapper` will automatically initialize Textmate and Themes related services. This disables monarch and language related feature in `monaco-editor` and only allows to build a "partial" VSCode Web application.

### Basic Extended Configuration

```typescript
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';

const vscodeApiConfig: MonacoVscodeApiConfig = {
    $type: 'extended',
    viewsConfig: {
        $type: 'EditorService',
        htmlContainer: document.getElementById('my-editor-dom-element')!
    }
    logLevel: LogLevel.Info,

    // User settings (like VSCode settings.json)
    userConfiguration: {
        json: JSON.stringify({
            'workbench.colorTheme': 'Default Dark Modern'
        })
    },

    // specific features handled by web workers
    monacoWorkerFactory: configureDefaultWorkerFactory
};

const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
await apiWrapper.start();
```

### Service Overrides

You can also override VSCode services to customize their behavior. For example, to customize keybindings and locale configuration:

```typescript
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { createDefaultLocaleConfiguration } from 'monaco-languageclient/vscodeApiLocales';

const vscodeApiConfig: MonacoVscodeApiConfig = {
    $type: 'extended',
    viewsConfig: {
        $type: 'EditorService',
        htmlContainer: document.getElementById('my-editor-dom-element')!
    }

    // Override specific services
    serviceOverrides: {
        ...getKeybindingsServiceOverride(),
        ...getLocalizationServiceOverride(createDefaultLocaleConfiguration())
    }
};

const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
await apiWrapper.start();
```

### Language Client Configuration

You can also configure how the editor connects to language servers by setting connection & client options:

```typescript
import { type LanguageClientConfig, LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';

const languageClientConfig: LanguageClientConfig = {
    connection: {
        options: {
            // WebSocket connection to external server
            $type: 'WebSocketUrl',
            url: 'ws://localhost:3000/languageserver',
            startOptions: {
                onCall: (languageClient?: BaseLanguageClient) => {
                  console.log(`Language running: ${languageClient?.isRunning()}`):
                }
                reportStatus: true
            }
        }
    },

    clientOptions: {
        // Which file extensions this language server handles
        documentSelector: ['python'],

        // Workspace configuration
        workspaceFolder: {
            index: 0,
            name: 'my-project',
            uri: vscode.Uri.file('/workspace')
        },

        // Custom initialization options for the language server
        initializationOptions: {
            mySpecificLSOption: 'foo'
        }
    }
};

const lcWrapper = new LanguageClientWrapper(languageClientConfig);
await lcWrapper.start();
```

## Classic Mode Configuration

Classic Mode uses the standard Monaco Editor with language client features added in:

```typescript
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';

const vscodeApiConfig: MonacoVscodeApiConfig = {
    $type: 'classic',
    viewsConfig: {
        $type: 'EditorService',
        htmlContainer: document.getElementById('my-editor-dom-element')!
    }
};

const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
await apiWrapper.start();

const editorAppConfig: EditorAppConfig = {};
const editorApp = new EditorApp(editorAppConfig);
editorApp.start(apiWrapper.getHtmlContainer());
```

## Common Configuration Options

### VSCode Settings

You can further configure VSCode related settings through the user configuration object:

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

In most cases you'll need to setup an in-memory or remote file system for the editor to work with.

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

You can also setup a file system that leverages the browser's local storage or IndexedDB for persistence as well.

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

#### Worker Config

```typescript
connection: {
    options: {
        $type: 'WorkerConfig',
        url: new URL('./language-server-worker.js', window.location.href),
        // we suggest to use esm workers (=module)
        type: 'module',
        workerName: 'LanguageServerWorker'
    }
}
```

#### Direct Web Worker Connection

```typescript
connection: {
    options: {
        $type: 'WorkerDirect',
        // we suggest to use esm workers (=module)
        worker: new Worker('./language-server.js', { type: 'module' })
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
// Eclipse JDT language client
const javaConfig = {
    connection: {
        options: {
            $type: 'WebSocketUrl',
            url: 'ws://localhost:3001/jdtls'
        }
    },
    clientOptions: {
        documentSelector: ['java']
    }
};

// JSON language client
const jsonConfig = {
    connection: {
        options: {
            $type: 'WebSocketUrl',
            url: 'ws://localhost:3001/json'
        }
    },
    clientOptions: {
        documentSelector: ['json']
    }
};

// Initialize both
await Promise.all([
    new LanguageClientWrapper().init(javaConfig),
    new LanguageClientWrapper().init(jsonConfig)
]);
```

## Configuration Validation

The configuration is validated at runtime. Common validation errors:

- **Missing htmlContainer**: Must provide a DOM element for Extended Mode
- **Missing document selector**: Language clients need to know which files to handle

## Next Steps

- **See [Examples](examples.md)** for complete configuration examples
- **Learn [Extended Mode](../advanced-usage/extended-mode.md)** for advanced VSCode features
- **Explore [WebSocket Communication](../advanced-usage/websockets.md)** for external language servers
- **Check [Troubleshooting](../guides/troubleshooting.md)** for configuration issues

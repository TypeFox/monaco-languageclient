# Basic Examples

This page provides simple, focused examples that demonstrate core Monaco Language Client functionality. Each example is minimal and self-contained to help you understand specific concepts.

## Example 1: JSON Editor (extended mode)

Using `monaco-languageclient` and `monaco-editor` to connect a JSON language server in extended mode:

```typescript
// Import required extensions for JSON support
import '@codingame/monaco-vscode-json-default-extension';

// Import Monaco Language Client components
import { EditorApp } from 'monaco-languageclient/editorApp';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';

// VSCode API for file system operations
import * as vscode from 'vscode';
import { LogLevel } from '@codingame/monaco-vscode-api';

async function createJsonEditor() {
    const languageId = 'json';
    // Sample JSON content
    const code = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": "unix"
}`;
    const codeUri = '/workspace/hello.json';

    // Monaco VSCode API configuration
    const vscodeApiConfig = {
        $type: 'extended',
        viewsConfig: {
            $type: 'EditorService'
        },
        logLevel: LogLevel.Debug,
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern',
                'editor.wordBasedSuggestions': 'off'
            })
        },
        monacoWorkerFactory: configureDefaultWorkerFactory
    };

    // Language client configuration
    const languageClientConfig = {
        languageId,
        connection: {
            options: {
                $type: 'WebSocketUrl',
                url: 'ws://localhost:30000/sampleServer'
            }
        },
        clientOptions: {
            documentSelector: [languageId],
            workspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: vscode.Uri.file('/workspace')
            }
        }
    };

    // Create the monaco-vscode api Wrapper
    const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await apiWrapper.start();

    // Create language client wrapper
    const lcWrapper = new LanguageClientWrapper(languageClientConfig);
    await lcWrapper.start();

    // Create the editor app
    const editorApp = new EditorApp({
        codeResources: {
            modified: {
                text: jsonContent,
                uri: codeUri
            }
        }
    });

    // Start the editor
    const htmlContainer = document.getElementById('monaco-editor-root')!;
    await editorApp.start(htmlContainer);

    console.log('JSON editor with language client is ready!');
}
createJsonEditor().catch(console.error);
```

## Example 2: JSON Editor (classic mode)

Using `monaco-languageclient` and `monaco-editor` to connect a JSON language server in classic mode see [json_classic example](../../packages/examples/src/json/client/classic.ts):

```typescript
import { LogLevel } from '@codingame/monaco-vscode-api';
import type { Logger } from 'monaco-languageclient/common';
import { EditorApp, type EditorAppConfig } from 'monaco-languageclient/editorApp';
import { LanguageClientWrapper, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { defineDefaultWorkerLoaders, useWorkerFactory } from 'monaco-languageclient/workerFactory';

export const runClient = async () => {
    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'classic',
        viewsConfig: {
            $type: 'EditorService'
        },
        logLevel: LogLevel.Debug,
        userConfiguration: {
            json: JSON.stringify({
                'editor.experimental.asyncTokenization': true
            })
        },
        monacoWorkerFactory: configureClassicWorkerFactory
    };

    const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await apiWrapper.start();

    const languageId = 'json';
    const code = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": "unix"
}`;
    const codeUri = '/workspace/model.json';
    const editorAppConfig: EditorAppConfig = {
        codeResources: {
            modified: {
                text: code,
                uri: codeUri
            }
        },
        languageDef: {
            languageExtensionConfig: {
                id: languageId,
                extensions: ['.json', '.jsonc'],
                aliases: ['JSON', 'json'],
                mimetypes: ['application/json']
            }
        }
    };
    const editorApp = new EditorApp(editorAppConfig);
    const htmlContainer = document.getElementById('monaco-editor-root')!;
    await editorApp.start(htmlContainer);

    const languageClientConfig: LanguageClientConfig = {
        languageId,
        clientOptions: {
            documentSelector: [languageId]
        },
        connection: {
            options: {
                $type: 'WebSocketUrl',
                // at this url the language server must be reachable
                url: 'ws://localhost:30000/jsonLS'
            }
        }
    };
    const languageClientWrapper = new LanguageClientWrapper(
        languageClientConfig,
        apiWrapper.getLogger()
    );
    await languageClientWrapper.start();
};

export const configureClassicWorkerFactory = (logger?: Logger) => {
    const defaultworkerLoaders = defineDefaultWorkerLoaders();
    // remove textmate worker as it is not compatible with classic mode
    defaultworkerLoaders.TextMateWorker = undefined;
    useWorkerFactory({
        workerLoaders: defaultworkerLoaders,
        logger
    });
};
```

## Example 3: In-Memory File System

Setting up files without actual file system access:

```typescript
import { RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';
import * as vscode from 'vscode';

// Create file system provider
const fileSystemProvider = new RegisteredFileSystemProvider(false);

// Add files to memory
const files = [
    { path: '/workspace/main.java', content: `public static void main (String[] args) {
    System.out.println("Hello World!");
}`,
    { path: '/workspace/package.json', content: '{"name": "my-app", "version": "1.0.0"}' }
];

files.forEach(file => {
    const uri = vscode.Uri.file(file.path);
    const memFile = new RegisteredMemoryFile(uri, file.content);
    fileSystemProvider.registerFile(memFile);
});

// Register the file system
registerFileSystemOverlay(1, fileSystemProvider);
```

## Example 4: Multiple Language Support

Handling multiple languages in one editor:

```typescript
import '@codingame/monaco-vscode-json-default-extension';
import '@codingame/monacovscode-java-default-extension';

async function createMultiLanguageEditor() {
    const apiWrapper = new MonacoVscodeApiWrapper({
        $type: 'extended',
        viewsConfig: {
            $type: 'EditorService'
        },
        monacoWorkerFactory: configureDefaultWorkerFactory
    });
    await apiWrapper.start();

    // JSON Language Client
    const jsonClient = new LanguageClientWrapper();
    await jsonClient.init({
        connection: { options: { $type: 'WebSocketUrl', url: 'ws://localhost:3001/json' }},
        clientOptions: { documentSelector: ['json'] }
    });

    // Java Language Client
    const javaClient = new LanguageClientWrapper();
    await javaClient.init({
        connection: { options: { $type: 'WebSocketUrl', url: 'ws://localhost:3002/java' }},
        clientOptions: { documentSelector: ['java'] }
    });

    // Editor can now handle both JSON and Java files
    const editorApp = new EditorApp({
        codeResources: {
            json: { text: '{"test": true}', uri: '/workspace/config.json', fileExt: 'json' },
            ts: { text: 'const x: number = 42;', uri: '/workspace/main.ts', fileExt: 'ts' }
        }
    });

    const htmlContainer = document.getElementById('monaco-editor-root')!;
    await editorApp.start(htmlContainer);
}
```

## Example 5: Web Worker Language Server

Running a language server in a Web Worker:

```typescript
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';

async function createWebWorkerClient() {
    // Create worker
    const worker = new Worker('./language-server.js', { type: 'module' });

    const reader = new BrowserMessageReader(worker);
    const writer = new BrowserMessageWriter(worker);

    // log every message received from the worker
    reader.listen((message) => {
        console.log('Received message from worker:', message);
    });

    // Configure language client
    const lcWrapper = new LanguageClientWrapper();
    await lcWrapper.init({
        connection: {
            options: {
                $type: 'MessageChannel',
                worker
            },
            messageTransports: { reader, writer }
        },
        clientOptions: {
            documentSelector: ['mydsl']
        }
    });
}
```

## Running the Examples

To run these examples:

1. **Install dependencies** as described in [Installation](../installation.md)

2. **Start language servers** (for WebSocket examples):

   ```shell
   # From the monaco-languageclient repository
   npm run start:example:server:json  # For JSON examples
   ```

3. **Set up your HTML file**:

   ```html
   <div id="editor" style="height: 100vh;"></div>
   <script type="module" src="./your-example.ts"></script>
   ```

4. **Use a development server** (like Vite) to serve your files

## Key Takeaways

- **Extended Mode** provides richer features but requires more setup
- **Classic Mode** is simpler but more limited
- **File systems** can be in-memory for browser-only applications
- **Multiple language clients** can coexist in the same editor
- **Web Workers** enable fully browser-based language servers

## Next Steps

- **Explore [Examples](./index.md)** for complete, working implementations
- **See [Troubleshooting](./troubleshooting.md)** if you encounter issues

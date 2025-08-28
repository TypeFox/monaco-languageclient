# Basic Examples

This page provides simple, focused examples that demonstrate core Monaco Language Client functionality. Each example is minimal and self-contained to help you understand specific concepts.

## Example 1: Simple JSON Editor

A minimal JSON editor with language server support:

```typescript
import '@codingame/monaco-vscode-json-default-extension';
import { EditorApp } from 'monaco-languageclient/editorApp';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import * as vscode from 'vscode';

async function createJsonEditor() {
    // Set up VS Code API
    const wrapper = new MonacoVscodeApiWrapper({
        $type: 'extended',
        htmlContainer: document.getElementById('editor')!,
        monacoWorkerFactory: configureDefaultWorkerFactory
    });
    await wrapper.init();

    // Configure language client
    const lcWrapper = new LanguageClientWrapper();
    await lcWrapper.init({
        connection: {
            options: {
                $type: 'WebSocketUrl',
                url: 'ws://localhost:30000/sampleServer'
            }
        },
        clientOptions: {
            documentSelector: ['json']
        }
    });

    // Create editor with JSON content
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
}

createJsonEditor();
```

## Example 2: Classic Mode Integration

Using Monaco Language Client with standard Monaco Editor:

```typescript
import { MonacoLanguageClient } from 'monaco-languageclient';
import { createConnection } from 'vscode-ws-jsonrpc';
import * as monaco from 'monaco-editor';

// Create Monaco editor
const editor = monaco.editor.create(document.getElementById('container')!, {
    value: 'console.log("Hello World");',
    language: 'javascript'
});

// Create WebSocket connection
const webSocket = new WebSocket('ws://localhost:3000/javascript');
const connection = createConnection(webSocket);

// Create language client
const client = new MonacoLanguageClient({
    name: 'JavaScript Client',
    clientOptions: {
        documentSelector: [{ language: 'javascript' }]
    },
    connection
});

// Start the client
await client.start();
connection.listen();
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
    { path: '/workspace/main.ts', content: 'const greeting = "Hello, TypeScript!";' },
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
import '@codingame/monaco-vscode-typescript-language-features-default-extension';

async function createMultiLanguageEditor() {
    const wrapper = new MonacoVscodeApiWrapper({
        $type: 'extended',
        htmlContainer: document.getElementById('editor')!,
        monacoWorkerFactory: configureDefaultWorkerFactory
    });
    await wrapper.init();

    // JSON Language Client
    const jsonClient = new LanguageClientWrapper();
    await jsonClient.init({
        connection: { options: { $type: 'WebSocketUrl', url: 'ws://localhost:3001/json' }},
        clientOptions: { documentSelector: ['json'] }
    });

    // TypeScript Language Client
    const tsClient = new LanguageClientWrapper();
    await tsClient.init({
        connection: { options: { $type: 'WebSocketUrl', url: 'ws://localhost:3002/typescript' }},
        clientOptions: { documentSelector: ['typescript'] }
    });

    // Editor can now handle both JSON and TypeScript files
    const editorApp = new EditorApp({
        codeResources: {
            json: { text: '{"test": true}', uri: '/workspace/config.json', fileExt: 'json' },
            ts: { text: 'const x: number = 42;', uri: '/workspace/main.ts', fileExt: 'ts' }
        }
    });
    
    await editorApp.init(wrapper);
}
```

## Example 5: Web Worker Language Server

Running a language server in a Web Worker:

```typescript
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';

async function createWebWorkerClient() {
    // Create worker
    const worker = new Worker('./language-server.js', { type: 'module' });
    
    // Set up message channel
    const channel = new MessageChannel();
    worker.postMessage({ port: channel.port2 }, [channel.port2]);
    
    const reader = new BrowserMessageReader(channel.port1);
    const writer = new BrowserMessageWriter(channel.port1);

    // Configure language client
    const lcWrapper = new LanguageClientWrapper();
    await lcWrapper.init({
        connection: {
            options: {
                $type: 'MessageChannel',
                reader,
                writer
            }
        },
        clientOptions: {
            documentSelector: ['mydsl']
        }
    });
}
```

## Example 6: Custom Editor Configuration

Customizing Monaco Editor with language client:

```typescript
const editorConfig = {
    userConfiguration: {
        json: JSON.stringify({
            // Theme and appearance
            'workbench.colorTheme': 'Default Light Modern',
            'editor.fontSize': 16,
            'editor.fontFamily': 'JetBrains Mono, Consolas',
            
            // Editor behavior
            'editor.wordWrap': 'on',
            'editor.lineNumbers': 'relative',
            'editor.minimap.enabled': false,
            'editor.folding': true,
            
            // Language features
            'editor.quickSuggestions': true,
            'editor.parameterHints.enabled': true,
            'editor.suggest.insertMode': 'replace',
            
            // Advanced features
            'editor.inlineSuggest.enabled': true,
            'editor.bracketPairColorization.enabled': true
        })
    }
};

const wrapper = new MonacoVscodeApiWrapper({
    $type: 'extended',
    htmlContainer: document.getElementById('editor')!,
    ...editorConfig
});
```

## Running the Examples

To run these examples:

1. **Install dependencies** as described in [Installation](../installation.md)

2. **Start language servers** (for WebSocket examples):
   ```bash
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

- **Try [Advanced Usage](../advanced-usage/index.md)** for more sophisticated integrations
- **Explore [Examples](../examples/index.md)** for complete, working implementations
- **Check [API Reference](../api-reference/index.md)** for detailed configuration options
- **See [Troubleshooting](../guides/troubleshooting.md)** if you encounter issues
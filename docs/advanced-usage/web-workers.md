# Web Workers

Web Workers enable you to run language servers entirely in the browser, providing language features without requiring external server processes. This approach offers better performance, offline capabilities, and simplified deployment.

## When to Use Web Workers

Choose Web Workers for language servers when you need:
- **Browser-only solutions** without external dependencies
- **Offline functionality** that works without network access
- **Simplified deployment** with no server infrastructure
- **Custom DSLs** built with tools like Langium (which naturally support targeting browser environments)

## Basic Web Worker Setup

Here's a complete example using a language server in a Web Worker:

### Step 1: Language Server Worker

Create a Web Worker that implements your language server:

```typescript
// language-server-worker.ts
import { createConnection, TextDocuments, ProposedFeatures } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';

// Create message reader/writer for worker communication
const messageReader = new BrowserMessageReader(self as DedicatedWorkerGlobalScope);
const messageWriter = new BrowserMessageWriter(self as DedicatedWorkerGlobalScope);

// Create language server connection
const connection = createConnection(ProposedFeatures.all, messageReader, messageWriter);

// Create document manager
const documents = new TextDocuments(TextDocument);

// Document change handler
documents.onDidChangeContent(change => {
    validateDocument(change.document);
});

// Validation function
function validateDocument(document: TextDocument): void {
    const diagnostics = [];
    const text = document.getText();

    // Simple JSON validation example
    try {
        JSON.parse(text);
    } catch (error) {
        diagnostics.push({
            severity: 1, // Error
            range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: text.length }
            },
            message: `JSON Parse Error: ${error.message}`,
            source: 'json-worker'
        });
    }

    connection.sendDiagnostics({ uri: document.uri, diagnostics });
}

// Initialize server
connection.onInitialize(() => {
    return {
        capabilities: {
            textDocumentSync: 1, // Full document sync
            diagnosticProvider: true,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['"', ':']
            }
        }
    };
});

// Completion provider
connection.onCompletion(() => {
    return [
        {
            label: 'name',
            kind: 1, // Text
            data: 1,
            insertText: '"name": "$1"'
        },
        {
            label: 'version',
            kind: 1,
            data: 2,
            insertText: '"version": "$1"'
        }
    ];
});

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();
```

### Step 2: Client Integration

Set up the language client to communicate with the Web Worker:

```typescript
// main.ts
import { EditorApp } from 'monaco-languageclient/editorApp';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import * as vscode from 'vscode';

async function setupWebWorkerLanguageClient() {
    // Create the Web Worker
    const worker = new Worker('./language-server-worker.js', { type: 'module' });

    // Set up message channel communication
    const channel = new MessageChannel();

    // Send one port to the worker
    worker.postMessage({ port: channel.port2 }, [channel.port2]);

    // Use the other port for client communication
    const reader = new BrowserMessageReader(channel.port1);
    const writer = new BrowserMessageWriter(channel.port1);

    // Configure VS Code API wrapper
    const vscodeApiConfig = {
        $type: 'extended' as const,
        htmlContainer: document.getElementById('monaco-editor-root')!,
        monacoWorkerFactory: configureDefaultWorkerFactory
    };

    const wrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await wrapper.init();

    // Configure language client
    const languageClientConfig = {
        name: 'JSON Language Server',
        connection: {
            options: {
                $type: 'WorkerDirect',
                worker: worker
            },
            messageTransports: { reader, writer }
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
    const lcWrapper = new LanguageClientWrapper(languageClientConfig, wrapper.getLogger());
    await lcWrapper.start();

    // Create editor
    const editorApp = new EditorApp({
        $type: 'extended',
        codeResources: {
            main: {
                text: '{\n  "name": "example"\n}',
                uri: '/workspace/example.json'
            }
        }
    });

    await editorApp.start(vscodeApiConfig.htmlContainer!);

    console.log('Web Worker language server is ready!');
}

setupWebWorkerLanguageClient().catch(console.error);
```

## Langium-Based Web Workers

Langium provides excellent tooling for building DSL language servers that run in Web Workers:

### Step 1: Define Your Language

```typescript
// grammar.langium
grammar MyDSL

entry Model:
    entities+=Entity*;

Entity:
    'entity' name=ID '{'
        properties+=Property*
    '}';

Property:
    name=ID ':' type=ID;

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
```

### Step 2: Generate Language Server

```typescript
// my-dsl-server-worker.ts
import { startLanguageServer } from 'langium/lsp';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';
import { createMyDslServices } from './my-dsl-module.js';

// Create services for your DSL
const services = createMyDslServices();

// Set up worker communication
const messageReader = new BrowserMessageReader(self as DedicatedWorkerGlobalScope);
const messageWriter = new BrowserMessageWriter(self as DedicatedWorkerGlobalScope);

// Start the language server
startLanguageServer({
    languageServer: services.MyDsl,
    reader: messageReader,
    writer: messageWriter
});
```

### Step 3: Client Integration

```typescript
import workerUrl from './my-dsl-server-worker?worker&url';

const worker = new Worker(workerUrl, { type: 'module' });
const channel = new MessageChannel();

worker.postMessage({ port: channel.port2 }, [channel.port2]);

const reader = new BrowserMessageReader(channel.port1);
const writer = new BrowserMessageWriter(channel.port1);

// Configure for your DSL
const languageClientConfig = {
    name: 'My DSL Language Server',
    connection: {
        options: {
            $type: 'WorkerDirect',
            worker: worker
        },
        messageTransports: { reader, writer }
    },
    clientOptions: {
        documentSelector: ['mydsl'], // Your language ID
        workspaceFolder: {
            index: 0,
            name: 'workspace',
            uri: vscode.Uri.file('/workspace')
        }
    }
};
```

## Advanced Web Worker Patterns

### Worker Pool Management

For multiple language servers or heavy processing:

```typescript
class LanguageWorkerPool {
    private workers: Worker[] = [];
    private currentWorkerIndex = 0;

    constructor(workerScript: string, poolSize: number = 4) {
        for (let i = 0; i < poolSize; i++) {
            this.workers.push(new Worker(workerScript, { type: 'module' }));
        }
    }

    getNextWorker(): Worker {
        const worker = this.workers[this.currentWorkerIndex];
        this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length;
        return worker;
    }

    dispose() {
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
    }
}
```

### Shared Worker for Multiple Clients

```typescript
// shared-language-worker.ts
import { createConnection } from 'vscode-languageserver/node';

const connections = new Map();

// Handle new client connections
self.addEventListener('connect', (event) => {
    const port = event.ports[0];

    // Create unique connection for this client
    const connection = createConnection(/* ... */);
    connections.set(port, connection);

    port.onmessage = (e) => {
        // Route messages to appropriate connection
        connection.handleMessage(e.data);
    };
});
```

### Worker Communication with MessagePort

```typescript
// Advanced message channel setup
class WorkerLanguageClient {
    private worker?: Worker;
    private channel?: MessageChannel;

    async initialize(workerScript: string) {
        this.worker = new Worker(workerScript, { type: 'module' });
        this.channel = new MessageChannel();

        // Enhanced error handling
        this.worker.onerror = (error) => {
            console.error('Worker error:', error);
        };

        this.worker.onmessageerror = (error) => {
            console.error('Worker message error:', error);
        };

        // Send port to worker
        this.worker.postMessage({
            command: 'init',
            port: this.channel.port2
        }, [this.channel.port2]);

        return {
            reader: new BrowserMessageReader(this.channel.port1),
            writer: new BrowserMessageWriter(this.channel.port1)
        };
    }

    dispose() {
        this.channel?.port1.close();
        this.channel?.port2.close();
        this.worker?.terminate();
    }
}
```

## Performance Optimization

### Lazy Worker Loading

```typescript
class LazyWorkerManager {
    private workerPromise?: Promise<Worker>;

    async getWorker(): Promise<Worker> {
        if (!this.workerPromise) {
            this.workerPromise = this.createWorker();
        }
        return this.workerPromise;
    }

    private async createWorker(): Promise<Worker> {
        // Dynamically import worker
        const workerModule = await import('./language-server-worker?worker&url');
        return new Worker(workerModule.default, { type: 'module' });
    }
}
```

### Memory Management

```typescript
// Efficient document handling in worker
class WorkerDocumentManager {
    private documents = new Map<string, TextDocument>();
    private maxDocuments = 100;

    addDocument(uri: string, content: string) {
        // Limit memory usage
        if (this.documents.size >= this.maxDocuments) {
            const firstKey = this.documents.keys().next().value;
            this.documents.delete(firstKey);
        }

        this.documents.set(uri, TextDocument.create(uri, 'json', 1, content));
    }

    getDocument(uri: string): TextDocument | undefined {
        return this.documents.get(uri);
    }
}
```

## Build Configuration

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
    worker: {
        format: 'es',
        plugins: [
            // Configure worker-specific plugins
        ]
    },
    build: {
        rollupOptions: {
            output: {
                // Separate workers into their own chunks
                manualChunks: {
                    'language-worker': ['./src/language-server-worker.ts']
                }
            }
        }
    }
});
```

### Webpack Configuration

```javascript
// webpack.config.js
module.exports = {
    module: {
        rules: [
            {
                test: /\.worker\.ts$/,
                use: {
                    loader: 'worker-loader',
                    options: {
                        esModule: true,
                        filename: '[name].[contenthash].worker.js'
                    }
                }
            }
        ]
    }
};
```

## Debugging Web Workers

### Worker Debugging Setup

```typescript
// Debug-enabled worker
if (typeof importScripts === 'function') {
    // Running in worker context
    console.log('Language server worker started');

    // Enable debug logging
    const connection = createConnection(/* ... */);
    connection.console.info('Worker connection established');

    // Log all messages in development
    if (process.env.NODE_ENV === 'development') {
        connection.onRequest((method, params) => {
            console.log('Worker request:', method, params);
        });
    }
}
```

### Client-Side Debugging

```typescript
const worker = new Worker('./language-server-worker.js');

// Debug worker messages
worker.onmessage = (event) => {
    console.log('Message from worker:', event.data);
};

worker.onerror = (error) => {
    console.error('Worker error:', error);
};

// Debug language client communication
const reader = new BrowserMessageReader(channel.port1);
const writer = new BrowserMessageWriter(channel.port1);

// Log all LSP messages
reader.listen((message) => {
    console.log('LSP message received:', message);
});
```

## Common Patterns

### WASM Language Servers

For high-performance language servers:

```typescript
// wasm-language-worker.ts
import init, { LanguageServer } from './language-server.wasm';

async function initializeWasmLanguageServer() {
    await init(); // Initialize WASM module

    const languageServer = new LanguageServer();

    // Set up LSP communication
    const connection = createConnection(/* ... */);

    connection.onCompletion((params) => {
        // Call WASM language server
        const completions = languageServer.getCompletions(
            params.textDocument.uri,
            params.position.line,
            params.position.character
        );

        return JSON.parse(completions);
    });
}
```

### Tree-sitter Integration

```typescript
// tree-sitter-worker.ts
import Parser from 'web-tree-sitter';

let parser: Parser;

async function initializeParser() {
    await Parser.init();
    parser = new Parser();

    const Language = await Parser.Language.load('./tree-sitter-json.wasm');
    parser.setLanguage(Language);
}

// Use tree-sitter for syntax analysis
function analyzeDocument(content: string) {
    const tree = parser.parse(content);
    // Process syntax tree for language features
    return tree;
}
```

## Examples in This Project

The project includes excellent Web Worker examples using Langium:

### Langium Grammar DSL (`packages/examples/langium_extended.html`)
**Location**: `packages/examples/src/langium/langium-dsl/`
**Worker**: `packages/examples/src/langium/langium-dsl/worker/langium-server.ts`
**Description**: Edit Langium grammar files with the Langium grammar language server running in a Web Worker

### Statemachine DSL (`packages/examples/statemachine.html`)
**Location**: `packages/examples/src/langium/statemachine/`
**Workers**: Multiple worker variants in `packages/examples/src/langium/statemachine/worker/`
**Description**: Custom state machine DSL with full language server features in Web Workers

```bash
# Run the Web Worker examples
npm run dev

# Visit the examples:
# http://localhost:20001/langium_extended.html - Langium Grammar DSL
# http://localhost:20001/statemachine.html - Statemachine DSL
# http://localhost:20001/react_statemachine.html - React + Statemachine
```

### Real Implementation Patterns

The project's Langium examples demonstrate the actual patterns documented here:

**Worker Setup** (`langium-server.ts`):
```typescript
import { EmptyFileSystem } from 'langium';
import { startLanguageServer } from 'langium/lsp';
import { createLangiumGrammarServices } from 'langium/grammar';
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser.js';

const messageReader = new BrowserMessageReader(self as DedicatedWorkerGlobalScope);
const messageWriter = new BrowserMessageWriter(self as DedicatedWorkerGlobalScope);

const context = {
    connection: createConnection(messageReader, messageWriter),
    ...EmptyFileSystem
};
const { shared } = createLangiumGrammarServices(context);

startLanguageServer(shared);
```

**Client Integration** (`extendedConfig.ts`):
```typescript
const worker = new Worker(workerUrl, {
    type: 'module',
    name: 'Langium LS'
});

const languageClientConfig: LanguageClientConfig = {
    clientOptions: {
        documentSelector: ['langium']
    },
    connection: {
        options: {
            $type: 'WorkerDirect',
            worker
        },
        messageTransports: { reader, writer }
    }
};
```

## Next Steps

- Compare with [WebSocket Communication](./websockets.md) for external language servers
- Learn [Extended Mode with Langium](./extended-mode-with-langium.md) for detailed DSL development
- Try [Classic Mode](./classic-mode.md) or [Extended Mode](./extended-mode.md) integration patterns
- Check [Examples](../examples/index.md) for complete Web Worker implementations

Web Workers provide the most seamless way to integrate language servers directly in the browser, especially for custom DSLs built with Langium.

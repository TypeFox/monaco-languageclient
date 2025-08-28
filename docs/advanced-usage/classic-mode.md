# Classic Mode

Classic Mode provides a lightweight integration approach using the standard Monaco Editor with language client features added on top. This mode offers simpler setup, smaller bundle size, and direct access to the Monaco Editor API.

## When to Use Classic Mode

Choose Classic Mode when you need:
- **Lightweight integration** with minimal dependencies
- **Smaller bundle size** for performance-critical applications  
- **Direct Monaco Editor control** with full access to the Monaco API
- **Simple language server integration** without VS Code services overhead
- **Custom editor implementations** that don't need VS Code-like features

## Basic Classic Mode Setup

Here's a complete example using Classic Mode with a JSON language server:

```typescript
import { MonacoLanguageClient } from 'monaco-languageclient';
import { createWebSocketConnection } from 'vscode-ws-jsonrpc';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient';
import * as monaco from 'monaco-editor';

// Create Monaco Editor
const editor = monaco.editor.create(document.getElementById('container')!, {
    value: `{
    "name": "example",
    "version": "1.0.0",
    "description": "A simple example"
}`,
    language: 'json',
    theme: 'vs-dark',
    automaticLayout: true
});

// Create WebSocket connection to language server
const webSocket = new WebSocket('ws://localhost:30000/sampleServer');

// Set up the connection
const connection = createWebSocketConnection(webSocket, console);

// Configure the language client
const client = new MonacoLanguageClient({
    name: 'JSON Language Client',
    clientOptions: {
        // Which documents the language client should handle
        documentSelector: [{ language: 'json' }],
        
        // Error handling
        errorHandler: {
            error: () => ({ action: ErrorAction.Continue }),
            closed: () => ({ action: CloseAction.DoNotRestart })
        },
        
        // Workspace configuration
        workspaceFolder: {
            uri: 'file:///workspace',
            name: 'workspace'
        }
    },
    
    // Use the WebSocket connection
    connection
});

// Start the language client
client.start().then(() => {
    console.log('JSON Language Client started');
}).catch(error => {
    console.error('Failed to start language client:', error);
});

// Start listening for messages
connection.listen();
```

## Advanced Classic Mode Configuration

### Custom Document Handling

```typescript
const client = new MonacoLanguageClient({
    name: 'Multi-Language Client',
    clientOptions: {
        // Handle multiple document types
        documentSelector: [
            { language: 'json' },
            { language: 'javascript' },
            { language: 'typescript' }
        ],
        
        // Custom initialization options for the language server
        initializationOptions: {
            preferences: {
                includeCompletionsForModuleExports: true,
                includeCompletionsWithInsertText: true
            }
        },
        
        // Synchronization options
        synchronize: {
            // Synchronize configuration changes
            configurationSection: 'json',
            
            // File watchers
            fileEvents: monaco.workspace.createFileSystemWatcher('**/*.json')
        }
    },
    connection
});
```

### Error Handling and Recovery

```typescript
const client = new MonacoLanguageClient({
    name: 'Resilient Client',
    clientOptions: {
        documentSelector: [{ language: 'json' }],
        
        errorHandler: {
            error: (error, message, count) => {
                console.error('Language client error:', error, message);
                // Continue on errors, but log them
                return { action: ErrorAction.Continue };
            },
            
            closed: () => {
                console.log('Language client connection closed');
                // Don't automatically restart
                return { action: CloseAction.DoNotRestart };
            }
        }
    },
    connection
});
```

### Multiple Language Clients

Classic Mode allows you to run multiple language clients simultaneously:

```typescript
async function setupMultipleClients() {
    // JSON Language Client
    const jsonWebSocket = new WebSocket('ws://localhost:3001/json');
    const jsonConnection = createWebSocketConnection(jsonWebSocket, console);
    const jsonClient = new MonacoLanguageClient({
        name: 'JSON Client',
        clientOptions: { documentSelector: [{ language: 'json' }] },
        connection: jsonConnection
    });
    
    // TypeScript Language Client  
    const tsWebSocket = new WebSocket('ws://localhost:3002/typescript');
    const tsConnection = createWebSocketConnection(tsWebSocket, console);
    const tsClient = new MonacoLanguageClient({
        name: 'TypeScript Client', 
        clientOptions: { documentSelector: [{ language: 'typescript' }] },
        connection: tsConnection
    });
    
    // Start both clients
    await Promise.all([
        jsonClient.start(),
        tsClient.start()
    ]);
    
    // Start listening on both connections
    jsonConnection.listen();
    tsConnection.listen();
}
```

## Monaco Editor Integration

### Custom Monaco Configuration

```typescript
// Configure Monaco with custom options
const editor = monaco.editor.create(document.getElementById('editor')!, {
    value: '',
    language: 'json',
    theme: 'vs-dark',
    
    // Editor behavior
    automaticLayout: true,
    wordWrap: 'on',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    
    // Language features (enhanced by language client)
    quickSuggestions: true,
    parameterHints: { enabled: true },
    hover: { enabled: true },
    
    // Custom keybindings
    readOnly: false
});

// Add custom commands
editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    console.log('Save requested');
    // Implement save logic
});
```

### Accessing Monaco APIs

Classic Mode gives you full access to Monaco Editor APIs:

```typescript
// Get current editor state
const model = editor.getModel();
const value = model?.getValue();
const position = editor.getPosition();

// Listen to editor changes
editor.onDidChangeModelContent(() => {
    console.log('Editor content changed');
});

// Programmatically modify content
editor.setValue('{"new": "content"}');
editor.setPosition({ lineNumber: 1, column: 1 });

// Add decorations
const decorations = editor.deltaDecorations([], [{
    range: new monaco.Range(1, 1, 1, 10),
    options: { 
        className: 'highlight-decoration',
        hoverMessage: { value: 'Custom hover message' }
    }
}]);
```

## Performance Optimization

Classic Mode offers several performance advantages:

### Minimal Bundle Size
```typescript
// Only import what you need
import { MonacoLanguageClient } from 'monaco-languageclient';
import { createWebSocketConnection } from 'vscode-ws-jsonrpc';
import * as monaco from 'monaco-editor';

// No additional VS Code services = smaller bundle
```

### Memory Management
```typescript
class LanguageClientManager {
    private clients: MonacoLanguageClient[] = [];
    
    async addClient(config: any) {
        const client = new MonacoLanguageClient(config);
        await client.start();
        this.clients.push(client);
        return client;
    }
    
    async dispose() {
        // Clean up all clients
        await Promise.all(this.clients.map(client => client.stop()));
        this.clients = [];
    }
}
```

## Connection Management

### WebSocket Connection with Reconnection

```typescript
class ReconnectingWebSocketConnection {
    private webSocket?: WebSocket;
    private client?: MonacoLanguageClient;
    
    async connect(url: string) {
        this.webSocket = new WebSocket(url);
        
        this.webSocket.onopen = () => {
            console.log('WebSocket connected');
            this.setupLanguageClient();
        };
        
        this.webSocket.onclose = () => {
            console.log('WebSocket disconnected, attempting reconnection...');
            setTimeout(() => this.connect(url), 5000);
        };
        
        this.webSocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }
    
    private setupLanguageClient() {
        if (!this.webSocket) return;
        
        const connection = createWebSocketConnection(this.webSocket, console);
        this.client = new MonacoLanguageClient({
            name: 'Reconnecting Client',
            clientOptions: { documentSelector: [{ language: 'json' }] },
            connection
        });
        
        this.client.start();
        connection.listen();
    }
}
```

## Comparison with Extended Mode

| Feature | Classic Mode | Extended Mode |
|---------|-------------|---------------|
| Bundle Size | Smaller | Larger |
| Setup Complexity | Simple | More Complex |
| VS Code Services | Not Available | Full Access |
| Monaco API Access | Direct | Through Wrapper |
| Language Features | Basic LSP | Enhanced LSP + VS Code |
| Performance | Lighter | Heavier |
| Customization | Full Monaco Control | Service-based |

## Common Use Cases

### Simple Code Editor
Perfect for applications that need basic language server features without VS Code complexity:

```typescript
// Minimal setup for a simple JSON editor
const editor = monaco.editor.create(container, {
    value: jsonContent,
    language: 'json'
});

const client = new MonacoLanguageClient({
    name: 'Simple JSON Client',
    clientOptions: { documentSelector: [{ language: 'json' }] },
    connection: createWebSocketConnection(webSocket, console)
});

await client.start();
```

### Custom Language Support
Ideal for adding language support to existing Monaco Editor applications:

```typescript
// Add language client to existing Monaco setup
const existingEditor = monaco.editor.getModel();
if (existingEditor) {
    const client = new MonacoLanguageClient({
        name: 'Custom Language Client',
        clientOptions: { documentSelector: [{ language: 'mylang' }] },
        connection: myLanguageServerConnection
    });
    
    await client.start();
}
```

## Troubleshooting

### Common Issues

**Language features not working**: Verify WebSocket connection and document selector
**Performance issues**: Check if multiple clients are properly disposed
**Connection errors**: Implement proper error handling and reconnection logic

### Debugging

```typescript
const client = new MonacoLanguageClient({
    name: 'Debug Client',
    clientOptions: {
        documentSelector: [{ language: 'json' }],
        // Enable detailed logging
        outputChannelName: 'JSON Language Server'
    },
    connection
});

// Log all LSP messages
connection.trace = 2; // Verbose tracing
```

## Next Steps

- **Compare with [Extended Mode](extended-mode.md)** to understand the differences
- **Learn [WebSocket Communication](websockets.md)** for external language server setup
- **Try [Examples](../examples/index.md)** for complete implementations
- **Check [Performance Guide](../guides/performance.md)** for optimization techniques
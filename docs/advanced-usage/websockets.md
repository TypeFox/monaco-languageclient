# WebSocket Communication

WebSocket communication enables Monaco Language Client to connect to external language servers running as separate processes. This approach provides maximum flexibility for language server deployment and supports any LSP-compliant language server.

## When to Use WebSockets

Choose WebSocket communication when you need:
- **External language servers** running in Node.js, Python, Java, etc.
- **Existing language servers** that you want to integrate
- **Server-side processing** for heavy language operations
- **Multi-user support** with shared language server instances
- **Production scalability** with dedicated language server infrastructure

## Basic WebSocket Setup

Here's a complete example connecting to a JSON language server via WebSocket:

### Client-Side Setup

```typescript
import '@codingame/monaco-vscode-json-default-extension';
import { EditorApp } from 'monaco-languageclient/editorApp';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import * as vscode from 'vscode';
import { LogLevel } from '@codingame/monaco-vscode-api';

async function connectToLanguageServer() {
    // Configure VS Code API wrapper
    const vscodeApiConfig = {
        $type: 'extended' as const,
        htmlContainer: document.getElementById('monaco-editor-root')!,
        logLevel: LogLevel.Info,
        monacoWorkerFactory: configureDefaultWorkerFactory
    };
    
    const wrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await wrapper.init();
    
    // Configure WebSocket connection to language server
    const languageClientConfig = {
        connection: {
            options: {
                $type: 'WebSocketUrl' as const,
                url: 'ws://localhost:30000/sampleServer',
                startOptions: {
                    onCall: () => {
                        console.log('Connected to language server');
                    },
                    reportStatus: true
                },
                stopOptions: {
                    onCall: () => {
                        console.log('Disconnected from language server');
                    },
                    reportStatus: true
                }
            }
        },
        clientOptions: {
            documentSelector: ['json'],
            workspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: vscode.Uri.file('/workspace')
            },
            // Custom initialization options for the language server
            initializationOptions: {
                provideFormatter: true,
                provideDocumentSymbols: true
            }
        }
    };
    
    // Initialize language client
    const lcWrapper = new LanguageClientWrapper();
    await lcWrapper.init(languageClientConfig);
    
    // Create editor application
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
    console.log('WebSocket language client ready!');
}

connectToLanguageServer().catch(console.error);
```

### Server-Side Setup (Node.js)

```typescript
// server.ts
import express from 'express';
import { WebSocketServer } from 'ws';
import { createConnection, createServerProcess, forward } from 'vscode-ws-jsonrpc/server';
import { Message } from 'vscode-languageserver';

const app = express();
const server = app.listen(30000, () => {
    console.log('Language server proxy listening on port 30000');
});

// Create WebSocket server
const wss = new WebSocketServer({ 
    server,
    path: '/sampleServer'
});

wss.on('connection', (webSocket) => {
    console.log('Client connected');
    
    // Create WebSocket connection wrapper
    const socketConnection = createConnection(webSocket, console);
    
    // Start the actual language server process
    const serverConnection = createServerProcess('JSON Language Server', 'node', [
        './node_modules/vscode-json-languageserver/bin/vscode-json-languageserver',
        '--stdio'
    ]);
    
    // Forward messages between WebSocket and language server
    forward(socketConnection, serverConnection, (message: Message) => {
        console.log('Forwarding message:', message.method);
        return message;
    });
    
    webSocket.on('close', () => {
        console.log('Client disconnected');
    });
});
```

## Advanced WebSocket Configuration

### Connection Options

```typescript
const connectionConfig = {
    $type: 'WebSocketUrl' as const,
    url: 'ws://localhost:3000/languageserver',
    
    // Connection lifecycle hooks
    startOptions: {
        onCall: () => console.log('Starting connection...'),
        reportStatus: true
    },
    
    stopOptions: {
        onCall: () => console.log('Stopping connection...'),  
        reportStatus: true
    },
    
    // WebSocket-specific options
    webSocketOptions: {
        protocols: ['lsp'],
        headers: {
            'Authorization': 'Bearer your-token'
        }
    }
};
```

### Connection Retry Logic

```typescript
class ReconnectingWebSocketClient {
    private lcWrapper?: LanguageClientWrapper;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    
    async connect(config: any) {
        try {
            this.lcWrapper = new LanguageClientWrapper();
            await this.lcWrapper.init(config);
            
            this.reconnectAttempts = 0;
            console.log('Language client connected successfully');
            
        } catch (error) {
            console.error('Connection failed:', error);
            this.scheduleReconnect(config);
        }
    }
    
    private scheduleReconnect(config: any) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
            
            setTimeout(() => {
                this.connect(config);
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }
}
```

## Multiple Language Servers

### Connecting to Different Servers

```typescript
async function setupMultipleLanguageServers() {
    const servers = [
        {
            name: 'TypeScript',
            url: 'ws://localhost:3001/typescript',
            documentSelector: ['typescript', 'javascript']
        },
        {
            name: 'JSON',
            url: 'ws://localhost:3002/json',
            documentSelector: ['json']
        },
        {
            name: 'Python',
            url: 'ws://localhost:3003/python',
            documentSelector: ['python']
        }
    ];
    
    const languageClients = await Promise.all(
        servers.map(async (serverConfig) => {
            const lcWrapper = new LanguageClientWrapper();
            
            await lcWrapper.init({
                connection: {
                    options: {
                        $type: 'WebSocketUrl',
                        url: serverConfig.url
                    }
                },
                clientOptions: {
                    documentSelector: serverConfig.documentSelector
                }
            });
            
            return { name: serverConfig.name, client: lcWrapper };
        })
    );
    
    console.log('All language servers connected:', languageClients.map(lc => lc.name));
}
```

### Load Balancing Language Servers

```typescript
class LoadBalancedLanguageClient {
    private servers: string[];
    private currentIndex = 0;
    
    constructor(serverUrls: string[]) {
        this.servers = serverUrls;
    }
    
    getNextServerUrl(): string {
        const url = this.servers[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.servers.length;
        return url;
    }
    
    async createClient() {
        const serverUrl = this.getNextServerUrl();
        
        const lcWrapper = new LanguageClientWrapper();
        await lcWrapper.init({
            connection: {
                options: {
                    $type: 'WebSocketUrl',
                    url: serverUrl
                }
            },
            clientOptions: {
                documentSelector: ['typescript']
            }
        });
        
        return lcWrapper;
    }
}
```

## Authentication and Security

### Token-Based Authentication

```typescript
const authenticatedConnection = {
    $type: 'WebSocketUrl' as const,
    url: 'wss://secure-language-server.com/api/lsp',
    webSocketOptions: {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'X-API-Key': apiKey
        }
    }
};
```

### Secure WebSocket (WSS)

```typescript
// Client-side secure connection
const secureConfig = {
    connection: {
        options: {
            $type: 'WebSocketUrl',
            url: 'wss://your-domain.com/languageserver', // Use wss:// for SSL
            webSocketOptions: {
                // Additional SSL options if needed
                rejectUnauthorized: true
            }
        }
    },
    clientOptions: {
        documentSelector: ['json']
    }
};
```

### Server-Side SSL Setup

```typescript
// server-ssl.ts
import https from 'https';
import fs from 'fs';
import { WebSocketServer } from 'ws';

const server = https.createServer({
    cert: fs.readFileSync('path/to/cert.pem'),
    key: fs.readFileSync('path/to/key.pem')
});

const wss = new WebSocketServer({ 
    server,
    path: '/languageserver'
});

server.listen(443, () => {
    console.log('Secure language server running on port 443');
});
```

## Message Filtering and Middleware

### Custom Message Processing

```typescript
// server.ts with message filtering
import { forward } from 'vscode-ws-jsonrpc/server';
import { Message } from 'vscode-languageserver';

forward(socketConnection, serverConnection, (message: Message) => {
    // Log all LSP messages
    console.log(`[${new Date().toISOString()}] ${message.method}`, message);
    
    // Filter or modify messages
    if (message.method === 'textDocument/didChange') {
        // Add custom processing for document changes
        console.log('Document changed');
    }
    
    // Custom error handling
    if (message.method === '$/error') {
        console.error('Language server error:', message);
    }
    
    return message;
});
```

### Client-Side Message Interception

```typescript
class MiddlewareLanguageClient {
    private lcWrapper: LanguageClientWrapper;
    
    constructor() {
        this.lcWrapper = new LanguageClientWrapper();
    }
    
    async init(config: any) {
        // Add middleware to the connection
        const originalConfig = {
            ...config,
            middleware: {
                // Intercept completion requests
                provideCompletionItem: (document, position, context, token, next) => {
                    console.log('Completion requested at:', position);
                    return next(document, position, context, token);
                },
                
                // Intercept hover requests
                provideHover: (document, position, token, next) => {
                    console.log('Hover requested at:', position);
                    return next(document, position, token);
                }
            }
        };
        
        await this.lcWrapper.init(originalConfig);
    }
}
```

## Performance Optimization

### Connection Pooling

```typescript
class ConnectionPool {
    private availableConnections: LanguageClientWrapper[] = [];
    private allConnections: LanguageClientWrapper[] = [];
    private maxConnections = 10;
    
    async getConnection(): Promise<LanguageClientWrapper> {
        if (this.availableConnections.length > 0) {
            return this.availableConnections.pop()!;
        }
        
        if (this.allConnections.length < this.maxConnections) {
            const lcWrapper = new LanguageClientWrapper();
            await lcWrapper.init(connectionConfig);
            this.allConnections.push(lcWrapper);
            return lcWrapper;
        }
        
        // Wait for available connection
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.getConnection();
    }
    
    releaseConnection(connection: LanguageClientWrapper) {
        this.availableConnections.push(connection);
    }
}
```

### Batched Messages

```typescript
// Server-side message batching
class MessageBatcher {
    private batch: Message[] = [];
    private batchTimeout?: NodeJS.Timeout;
    
    addMessage(message: Message) {
        this.batch.push(message);
        
        if (!this.batchTimeout) {
            this.batchTimeout = setTimeout(() => {
                this.flushBatch();
            }, 10); // 10ms batch window
        }
    }
    
    private flushBatch() {
        if (this.batch.length > 0) {
            // Process all messages in batch
            console.log(`Processing batch of ${this.batch.length} messages`);
            this.batch.forEach(message => {
                // Process individual message
            });
            this.batch = [];
        }
        this.batchTimeout = undefined;
    }
}
```

## Monitoring and Diagnostics

### Connection Health Monitoring

```typescript
class HealthMonitor {
    private lcWrapper: LanguageClientWrapper;
    private healthCheckInterval: NodeJS.Timeout;
    private lastPingTime = 0;
    
    constructor(lcWrapper: LanguageClientWrapper) {
        this.lcWrapper = lcWrapper;
        this.startHealthCheck();
    }
    
    private startHealthCheck() {
        this.healthCheckInterval = setInterval(async () => {
            try {
                this.lastPingTime = Date.now();
                
                // Send a health check request to the language server
                const result = await this.lcWrapper.sendRequest('health/ping', {});
                
                const responseTime = Date.now() - this.lastPingTime;
                console.log(`Health check OK (${responseTime}ms)`);
                
            } catch (error) {
                console.error('Health check failed:', error);
                // Implement reconnection logic
            }
        }, 30000); // Check every 30 seconds
    }
    
    dispose() {
        clearInterval(this.healthCheckInterval);
    }
}
```

### Performance Metrics

```typescript
class PerformanceMonitor {
    private requestTimes = new Map<string, number>();
    
    onRequest(method: string) {
        this.requestTimes.set(method, Date.now());
    }
    
    onResponse(method: string) {
        const startTime = this.requestTimes.get(method);
        if (startTime) {
            const duration = Date.now() - startTime;
            console.log(`${method} took ${duration}ms`);
            this.requestTimes.delete(method);
        }
    }
    
    getAverageResponseTime(): number {
        // Calculate average response time
        return 0; // Implementation details
    }
}
```

## Deployment Patterns

### Docker Container Setup

```dockerfile
# Dockerfile for language server
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 30000
CMD ["node", "server.js"]
```

### Kubernetes Deployment

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: language-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: language-server
  template:
    metadata:
      labels:
        app: language-server
    spec:
      containers:
      - name: language-server
        image: your-registry/language-server:latest
        ports:
        - containerPort: 30000
        env:
        - name: NODE_ENV
          value: "production"
---
apiVersion: v1
kind: Service
metadata:
  name: language-server-service
spec:
  selector:
    app: language-server
  ports:
  - protocol: TCP
    port: 30000
    targetPort: 30000
  type: LoadBalancer
```

## Troubleshooting

### Common WebSocket Issues

```typescript
// Debug WebSocket connection issues
const debugConnection = {
    $type: 'WebSocketUrl' as const,
    url: 'ws://localhost:30000/sampleServer',
    startOptions: {
        onCall: () => {
            console.log('WebSocket connection starting...');
        },
        reportStatus: true
    },
    stopOptions: {
        onCall: (error?: any) => {
            if (error) {
                console.error('WebSocket connection error:', error);
            } else {
                console.log('WebSocket connection closed normally');
            }
        },
        reportStatus: true
    }
};
```

### Server-Side Debugging

```typescript
wss.on('connection', (webSocket, request) => {
    console.log(`New connection from ${request.socket.remoteAddress}`);
    
    webSocket.on('message', (data) => {
        console.log('Received message:', data.toString());
    });
    
    webSocket.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
    
    webSocket.on('close', (code, reason) => {
        console.log(`Connection closed: ${code} - ${reason}`);
    });
});
```

## Next Steps

- **Learn [Web Workers](web-workers.md)** for in-browser language servers
- **Try [Classic Mode](classic-mode.md)** for lighter-weight integrations
- **Check [Examples](../examples/index.md)** for complete WebSocket implementations
- **See [Deployment Guide](../guides/deployment.md)** for production setup
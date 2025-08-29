# API Reference: vscode-ws-jsonrpc

This document provides a detailed API reference for the `vscode-ws-jsonrpc` package.

## Installation

```bash
npm install vscode-ws-jsonrpc
```

## Core Concepts

-   **`IWebSocket`**: An interface that represents a WebSocket connection. It abstracts away the differences between WebSockets in the browser and on the server.
-   **`WebSocketMessageReader`**: A class that reads JSON-RPC messages from a WebSocket.
-   **`WebSocketMessageWriter`**: A class that writes JSON-RPC messages to a WebSocket.

## Client-Side Usage

On the client side, you can use the `listen` function to connect to a WebSocket server and create a `MessageConnection`.

```typescript
import { MessageConnection, NotificationType } from 'vscode-jsonrpc';
import { listen } from 'vscode-ws-jsonrpc';

const webSocket = new WebSocket('ws://www.example.com/socketserver');
listen({
    webSocket,
    onConnection: (connection: MessageConnection) => {
        const notification = new rpc.NotificationType<string, void>('testNotification');
        connection.listen();
        connection.sendNotification(notification, 'Hello World');
    }
});
```

## Server-Side Usage

On the server side, you can use the `createWebSocketConnection` function to create a `MessageConnection` from a WebSocket.

```typescript
import { createWebSocketConnection, ConsoleLogger, IWebSocket } from 'vscode-ws-jsonrpc';
import { NotificationType } from 'vscode-languageserver';

const socket: IWebSocket; // open the web socket
const logger = new ConsoleLogger();
const connection = createWebSocketConnection(socket, logger);
const notification = new NotificationType<string, void>('testNotification');
connection.onNotification(notification, (param: string) => {
  console.log(param); // This prints Hello World
});

connection.listen();
```

### Server-Side Connection Forwarding

You can also use the `forward` function to forward messages between a WebSocket and a language server process.

```typescript
import { IWebSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import { createConnection, createServerProcess, forward } from 'vscode-ws-jsonrpc/server';
import { Message } from 'vscode-languageserver';

const socket: IWebSocket; // open the web socket
const reader = new WebSocketMessageReader(socket);
const writer = new WebSocketMessageWriter(socket);
const socketConnection = createConnection(reader, writer, () => socket.dispose())
const serverConnection = createServerProcess('Example', 'node', ['example.js']);
forward(socketConnection, serverConnection, message => {
    if (Message.isNotification(message)) {
        if (message.method === 'testNotification') {
            // handle the test notification
        }
    }
    return message;
});
```

## API

### `listen(options)`

-   **`options`**: `object`
    -   **`webSocket`**: `WebSocket`
    -   **`logger`**: `Logger` (optional)
    -   **`onConnection`**: `(connection: MessageConnection) => void`

### `createWebSocketConnection(socket, logger)`

-   **`socket`**: `IWebSocket`
-   **`logger`**: `Logger`

### `forward(clientConnection, serverConnection, onMessage)`

-   **`clientConnection`**: `MessageConnection`
-   **`serverConnection`**: `MessageConnection`
-   **`onMessage`**: `(message: Message) => Message` (optional)

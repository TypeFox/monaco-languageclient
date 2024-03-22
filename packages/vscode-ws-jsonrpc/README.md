# VSCode WebSocket JSON RPC

NPM module to implement communication between a jsonrpc client and server over WebSocket.

## CHANGELOG

All changes are noted in the [CHANGELOG](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/vscode-ws-jsonrpc/CHANGELOG.md).

## Getting Started

This is npm package is part of the <https://github.com/TypeFox/monaco-languageclient> mono repo. Please follow the main repositories [instructions]](<https://github.com/TypeFox/monaco-languageclient#getting-started>) to get started with local development.

## Usage

### Client side connection handling

```ts
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

### Server side connection handling

```ts
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

### Server side connection forwarding

```ts
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

## Examples

For a detailed list of examples please look at [this section](<https://github.com/TypeFox/monaco-languageclient#examples-overview>) in the main repository.

## License

[MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/vscode-ws-jsonrpc/LICENSE)

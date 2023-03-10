# VSCode WebSocket JSON RPC

NPM module to implement communication between a jsonrpc client and server over WebSocket.

See the following example code how to use this library or take a look of the `monaco-languageclient` and `vscode-ws-jsonrpc` examples here:

- [client](/packages/examples/main/src/client)
- [server](/packages/examples/main/src/server)

## Client side connection handling

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

## Server side connection handling

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

## Server side connection forwarding

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

## License

[MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/vscode-ws-jsonrpc/License.txt)

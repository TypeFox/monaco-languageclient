# VSCode WebSocket JSON RPC
NPM module to implement communication between a jsonrpc client and server over WebSocket.

### Client side connection handling
```ts
import * as rpc from 'vscode-ws-jsonrpc';

const webSocket = new WebSocket('ws://www.example.com/socketserver');
rpc.listen({
    webSocket,
    onConnection: (connection: rpc.MessageConnection) => {
        const notification = new rpc.NotificationType<string, void>('testNotification');
        connection.listen();
        connection.sendNotification(notification, 'Hello World');
    }
});
```

### Server side connection handling
```ts
import * as rpc from 'vscode-ws-jsonrpc';

const socket: rpc.IWebSocket; // open the web socket
const reader = new rpc.WebSocketMessageReader(socket);
const writer = new rpc.WebSocketMessageWriter(socket);
const logger = new rpc.ConsoleLogger();
const connection = rpc.createMessageConnection(reader, writer, logger);
const notification = new rpc.NotificationType<string, void>('testNotification');
connection.onNotification(notification, (param: string) => {
	console.log(param); // This prints Hello World
});

connection.listen();
```

### Server side connection forwarding
```ts
import * as rpc from 'vscode-ws-jsonrpc';
import * as server from 'vscode-ws-jsonrpc/lib/server';

const socket: rpc.IWebSocket; // open the web socket
const reader = new rpc.WebSocketMessageReader(socket);
const writer = new rpc.WebSocketMessageWriter(socket);
const socketConnection = server.createConnection(reader, writer, () => socket.dispose())
const serverConnection = server.createServerProcess('Example', 'node', ['example.js']);
server.forward(socketConnection, serverConnection, message => {
    if (rpc.isNotificationMessage(message)) {
        if (message.method === 'testNotification') {
            // handle the test notification
        }
    }
    return message;
});
```

## License
[MIT](https://github.com/TypeFox/vscode-ws-jsonrpc/blob/master/License.txt)

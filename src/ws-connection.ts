import { ConsoleLogger } from './logger';
import { MessageConnection, Logger } from 'vscode-jsonrpc';
import { createSocketConnection } from './socket';

export {
    MessageConnection
}

export function listen(options: {
    webSocket: WebSocket;
    logger?: Logger;
    onConnection: (connection: MessageConnection) => void;
}) {
    const { webSocket, onConnection } = options;
    const logger = options.logger ||  new ConsoleLogger();
    webSocket.onopen = () => {
        const connection = createSocketConnection({
            send: content => webSocket.send(content),
            onMessage: cb => webSocket.onmessage = event => cb(event.data),
            onError: cb => webSocket.onerror = event => {
                if (event instanceof ErrorEvent) {
                    cb(event.message)
                }
            },
            onClose: cb => webSocket.onclose = event => cb(event.code, event.reason),
            dispose: () => webSocket.close()
        }, logger);
        onConnection(connection);
    };
}
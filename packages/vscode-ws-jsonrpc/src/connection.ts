/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { MessageConnection, Logger } from 'vscode-jsonrpc';
import { createWebSocketConnection, IWebSocket } from './socket';
import { ConsoleLogger } from './logger';

export function listen(options: {
    webSocket: WebSocket;
    logger?: Logger;
    onConnection: (connection: MessageConnection) => void;
}) {
    const { webSocket, onConnection } = options;
    const logger = options.logger || new ConsoleLogger();
    webSocket.onopen = () => {
        const socket = toSocket(webSocket);
        const connection = createWebSocketConnection(socket, logger);
        onConnection(connection);
    };
}

export function toSocket(webSocket: WebSocket): IWebSocket {
    return {
        send: content => webSocket.send(content),
        onMessage: cb => webSocket.onmessage = event => cb(event.data),
        onError: cb => webSocket.onerror = event => {
            if ('message' in event) {
                cb((event as any).message)
            }
        },
        onClose: cb => webSocket.onclose = event => cb(event.code, event.reason),
        dispose: () => webSocket.close()
    }
}
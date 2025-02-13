/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { MessageConnection, Logger } from 'vscode-jsonrpc';
import { createWebSocketConnection } from './socket/connection.js';
import type { IWebSocket } from './socket/socket.js';
import { ConsoleLogger } from './logger.js';

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
        onMessage: cb => {
            webSocket.onmessage = event => cb(event.data);
        },
        onError: cb => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            webSocket.onerror = (event: any) => {
                if (Object.hasOwn(event, 'message')) {
                    cb(event.message);
                }
            };
        },
        onClose: cb => {
            webSocket.onclose = event => cb(event.code, event.reason);
        },
        dispose: () => webSocket.close()
    };
}

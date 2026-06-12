/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { createMessageConnection, type Logger, type MessageConnection } from 'vscode-jsonrpc';
import { ConsoleLogger, type IWebSocket } from 'vscode-ws-jsonrpc';
import { WebSocketMessageReader } from './reader.js';
import { WebSocketMessageWriter } from './writer.js';

export function createWebSocketConnection(socket: IWebSocket, logger: Logger): MessageConnection {
  const messageReader = new WebSocketMessageReader(socket);
  const messageWriter = new WebSocketMessageWriter(socket);
  const connection = createMessageConnection(messageReader, messageWriter, logger);
  connection.onClose(() => connection.dispose());
  return connection;
}

export function listen(options: { webSocket: WebSocket; logger?: Logger; onConnection: (connection: MessageConnection) => void }) {
  const { webSocket, onConnection } = options;
  const logger = options.logger ?? new ConsoleLogger();
  webSocket.onopen = () => {
    const socket = toSocket(webSocket);
    const connection = createWebSocketConnection(socket, logger);
    onConnection(connection);
  };
}

export function toSocket(webSocket: WebSocket): IWebSocket {
  return {
    send: (content) => webSocket.send(content),
    onMessage: (cb) => {
      webSocket.onmessage = (event) => cb(event.data);
    },
    onError: (cb) => {
      // oxlint-disable-next-line @typescript-eslint/no-explicit-any
      webSocket.onerror = (event: any) => {
        if (Object.hasOwn(event, 'message')) {
          cb(event.message);
        }
      };
    },
    onClose: (cb) => {
      webSocket.onclose = (event) => cb(event.code, event.reason);
    },
    dispose: () => webSocket.close()
  };
}

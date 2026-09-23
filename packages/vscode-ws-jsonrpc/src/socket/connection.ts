/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { createMessageConnection, type Logger, type MessageConnection } from 'vscode-jsonrpc';
import type { IWebSocket } from '../common/types.js';
import { ConsoleLogger } from '../common/logger.js';
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
  const createConnection = () => {
    const socket = toSocket(webSocket);
    const connection = createWebSocketConnection(socket, logger);
    onConnection(connection);
  };
  if (webSocket.readyState === WebSocket.OPEN) {
    createConnection();
  } else {
    webSocket.onopen = createConnection;
  }
}

export function toSocket(webSocket: WebSocket): IWebSocket {
  return {
    $type: 'IWebSocket',
    send: (content) => webSocket.send(content),
    onMessage: (cb) => {
      webSocket.onmessage = (event) => cb(event.data);
    },
    onError: (cb) => {
      webSocket.onerror = (event) => {
        if (event instanceof ErrorEvent) {
          cb(event.error ?? event.message);
        } else {
          cb(event);
        }
      };
    },
    onClose: (cb) => {
      webSocket.onclose = (event) => cb(event.code, event.reason);
    },
    dispose: () => webSocket.close()
  };
}

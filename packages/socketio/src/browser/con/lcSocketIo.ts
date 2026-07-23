/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { WebSocketConfigOptionsDirect } from 'monaco-languageclient/common';
import {
  DEFAULT_CONNECTION_TIMEOUT,
  type ConnectionConfig,
  LanguageClientConnectionRealization,
  type TransportLayerName
} from 'monaco-languageclient/lcwrapper';
import type { Socket } from 'socket.io-client';
import { SocketIoMessageReader, SocketIoMessageWriter } from 'vscode-socketio-jsonrpc';

export class LcSocketIo extends LanguageClientConnectionRealization {
  private socket?: Socket;

  getTransportLayerName(): TransportLayerName {
    return 'SocketIo';
  }

  init(languageId: string, connectionConfig: ConnectionConfig, errorHandler: (reason?: unknown) => void): void {
    this.languageId = languageId;
    const options = connectionConfig.options as WebSocketConfigOptionsDirect;
    this.socket = options.webSocket as unknown as Socket;

    this.clearPendingTimeout();
    this.createConnectionTimeout(connectionConfig.timeout ?? DEFAULT_CONNECTION_TIMEOUT, !this.socket.connected, errorHandler);

    this.socket.on('error', (ev: Event) => {
      this.createError(ev, 'Socket connection failed', errorHandler);
    });

    const messageTransports = connectionConfig.messageTransports ?? {
      reader: new SocketIoMessageReader(this.socket!),
      writer: new SocketIoMessageWriter(this.socket!)
    };

    // if already connected, signal immediately
    if (this.socket.connected) {
      this.clearPendingTimeout();
      this.connected(messageTransports);
    }

    // otherwise start on connect
    this.socket.on('connect', async () => {
      this.clearPendingTimeout();
      this.connected(messageTransports);
    });

    this.socket.on('disconnect', async () => {
      this.disconnected();
    });
  }

  dispose(): void {
    this.socket?.disconnect();
  }
}

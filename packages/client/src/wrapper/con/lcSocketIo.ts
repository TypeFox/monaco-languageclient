/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { Socket } from 'socket.io-client';
import { SocketIoMessageReader, SocketIoMessageWriter } from 'vscode-socketio-jsonrpc';
import type { SocketIoConfigOptionsDirect } from '../../common/commonTypes.js';
import type { ConnectionConfig } from '../lcconfig.js';
import { DEFAULT_CONNECTION_TIMEOUT, LanguageClientConnectionRealization, type TransportLayerName } from './lcConnectionRealization.js';

export class LcSocketIo extends LanguageClientConnectionRealization {
  private socket?: Socket;

  getTransportLayerName(): TransportLayerName {
    return 'SocketIo';
  }

  init(languageId: string, connectionConfig: ConnectionConfig, errorHandler: (reason?: unknown) => void): void {
    this.languageId = languageId;
    const options = connectionConfig.options as SocketIoConfigOptionsDirect;
    this.socket = options.webSocket as Socket;

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

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { Socket } from 'socket.io-client';
import type { MessageTransports } from 'vscode-languageclient/browser';
import { SocketIoMessageReader, SocketIoMessageWriter } from 'vscode-socketio-jsonrpc';
import type { SocketIoConfigOptionsDirect } from '../../common/commonTypes.js';
import type { ConnectionConfig } from '../lcconfig.js';
import type { LanguageClientError } from '../lcwrapper.js';
import type { LanguageClientConnectionRealization, TransportLayerName } from './contract.js';

export class LcSocketIo implements LanguageClientConnectionRealization {
  private languageId: string = 'unknown';
  private socket?: Socket;

  connected: () => void;
  disconnected: () => void;

  getTransportLayerName(): TransportLayerName {
    return 'SocketIo';
  }

  reinit(languageId: string, connectionConfig: ConnectionConfig): MessageTransports {
    this.languageId = languageId;
    const options = connectionConfig.options as SocketIoConfigOptionsDirect;
    this.socket = options.webSocket as Socket;

    let messageTransports = connectionConfig.messageTransports;
    messageTransports ??= {
      reader: new SocketIoMessageReader(this.socket!),
      writer: new SocketIoMessageWriter(this.socket!)
    };

    return messageTransports;
  }

  configureConnectionHandling(): void {
    // if already connected, signal immediately
    if (this.socket?.connected ?? false) {
      this.connected();
    }

    // otherwise start on connect
    this.socket?.on('connect', async () => {
      this.connected();
    });

    this.socket?.on('disconnect', async () => {
      this.disconnected();
    });
  }

  configureErrorHandling(handler: (reason?: unknown) => void): void {
    this.socket?.on('error', (ev: ErrorEvent) => {
      const languageClientError: LanguageClientError = {
        message: `LcSocketIo (${this.languageId}) created an error.`,
        error: ev.error ?? 'No error was provided.'
      };
      handler(languageClientError);
    });
  }

  dispose(): void {
    this.socket?.close();
  }
}

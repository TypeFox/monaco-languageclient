/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { MessageTransports } from 'vscode-languageclient/browser.js';
import type { ConnectionConfig } from '../lcconfig.js';
import type { LanguageClientConnectionRealization, TransportLayerName } from './contract.js';
import type { SocketIoConfigOptionsDirect } from '../../common/commonTypes.js';
import { SocketIoMessageReader, SocketIoMessageWriter } from 'vscode-socketio-jsonrpc';
import type { Socket } from 'socket.io-client';
import type { LanguageClientError } from '../lcwrapper.js';

export class LcSocketIo implements LanguageClientConnectionRealization {
  connected: () => void;
  disconnected: () => void;
  private languageId: string = 'unknown';
  private socket?: Socket;

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
    if (this.socket !== undefined) {
      this.socket.on('connect', () => {
        this.connected();
      });
    }
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

  dispose(): void {}
}

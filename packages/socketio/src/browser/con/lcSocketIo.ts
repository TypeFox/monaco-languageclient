/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { WebSocketConfigOptionsDirect } from 'monaco-languageclient/common';
import {
  DEFAULT_CONNECTION_TIMEOUT,
  LanguageClientConnectionSupport,
  type ConnectionConfig,
  type LanguageClientConnectionRealization,
  type TransportLayerName
} from 'monaco-languageclient/lcwrapper';
import type { Socket } from 'socket.io-client';
import type { MessageTransports } from 'vscode-languageclient';
import { SocketIoMessageReader, SocketIoMessageWriter } from 'vscode-socketio-jsonrpc';

export class LcSocketIo implements LanguageClientConnectionRealization {
  private support?: LanguageClientConnectionSupport;
  private languageId: string = 'unknown';
  private socket?: Socket;

  getLanguageId(): string {
    return this.languageId;
  }

  getTransportLayerName(): TransportLayerName {
    return 'SocketIo';
  }

  init(
    languageId: string,
    connectionConfig: ConnectionConfig,
    support: LanguageClientConnectionSupport,
    errorHandler: (reason?: unknown) => void
  ): void {
    this.languageId = languageId;
    this.support = support;
    this.support.setDisposeResources(connectionConfig.options.disposeResources === true);
    this.support.setRetryConfig(connectionConfig.retryConfig);
    const options = connectionConfig.options as WebSocketConfigOptionsDirect;
    this.socket = options.webSocket as unknown as Socket;

    this.support.clearPendingTimeout();
    this.support.createConnectionTimeout(
      connectionConfig.retryConfig?.timeout ?? DEFAULT_CONNECTION_TIMEOUT,
      !this.socket.connected,
      errorHandler
    );

    this.socket.on('error', (ev: Event) => {
      this.support?.createError(ev, 'Socket connection failed', errorHandler);
    });

    const messageTransports = connectionConfig.messageTransports ?? {
      reader: new SocketIoMessageReader(this.socket!),
      writer: new SocketIoMessageWriter(this.socket!)
    };

    // if already connected, signal immediately
    if (this.socket.connected) {
      this.support.clearPendingTimeout();
      this.connected(messageTransports);
    }

    // otherwise start on connect
    this.socket.on('connect', async () => {
      this.support?.clearPendingTimeout();
      this.connected(messageTransports);
    });

    this.socket.on('disconnect', async () => {
      this.disconnected();
    });
  }

  connected: (messageTransports: MessageTransports) => void;

  retry: (message: string, timeMs: number, count: number) => void;

  disconnected: () => void;

  restart(_count: number): void {
    if (this.support?.disposeOnRestart() === true) {
      this.socket?.disconnect();
      this.socket = undefined;
    }
  }

  dispose(): void {
    if (this.support?.getDisposeResources() === true) {
      this.socket?.disconnect();
      this.socket = undefined;
    }
  }
}

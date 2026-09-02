/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

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
import { SocketIoClient } from '../index.js';
import { createUrl, type WebSocketConfigOptionsParams, type WebSocketConfigOptionsUrl } from 'monaco-languageclient/common';

export class LcSocketIo implements LanguageClientConnectionRealization {
  private support?: LanguageClientConnectionSupport;
  private connectionConfig?: ConnectionConfig;
  private languageId: string = 'unknown';
  private socket?: Socket;
  private messageTransports?: MessageTransports;

  getLanguageId(): string {
    return this.languageId;
  }

  getTransportLayerName(): TransportLayerName {
    return 'SocketIo';
  }

  getMessageTransports(): MessageTransports | undefined {
    return this.messageTransports;
  }

  init(languageId: string, connectionConfig: ConnectionConfig, support: LanguageClientConnectionSupport): MessageTransports {
    this.languageId = languageId;
    this.connectionConfig = connectionConfig;
    this.support = support;
    this.support.setDisposeResources(connectionConfig.options.disposeResources === true);
    this.support.setRetryConfig(connectionConfig.retryConfig);

    const options = connectionConfig.options as WebSocketConfigOptionsParams | WebSocketConfigOptionsUrl;
    const socketIoClient = new SocketIoClient({
      url: createUrl(options)
    });
    this.socket = socketIoClient.start();

    this.messageTransports = {
      reader: new SocketIoMessageReader(this.socket!),
      writer: new SocketIoMessageWriter(this.socket!)
    };
    return this.messageTransports;
  }

  start(errorHandler: (reason?: unknown) => void): void {
    this.support?.clearPendingTimeout();
    this.support?.createConnectionTimeout(
      this.connectionConfig?.retryConfig?.timeout ?? DEFAULT_CONNECTION_TIMEOUT,
      this.socket?.connected !== true,
      errorHandler
    );

    // if already connected, signal immediately
    if (this.socket?.connected === true) {
      this.support?.clearPendingTimeout();
      this.connected();
    }

    if (this.socket !== undefined) {
      this.socket.on('error', (ev: Event) => {
        this.support?.createError(ev, 'Socket connection failed', errorHandler);
      });

      // otherwise start on connect
      this.socket.on('connect', async () => {
        this.support?.clearPendingTimeout();
        this.connected();
      });

      this.socket.on('disconnect', async () => {
        this.disconnected();
      });
    }
  }

  connected: () => void;

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

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { createUrl, Deferred, type WebSocketConfigOptionsParams, type WebSocketConfigOptionsUrl } from 'monaco-languageclient/common';
import type { MessageTransports } from 'vscode-languageclient';
import { WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import { DEFAULT_CONNECTION_TIMEOUT, type LanguageClientConnectionRealization } from './lcConnectionRealization.js';
import { LanguageClientConnectionSupport } from './lcConnectionSupport.js';
import type { ConnectionConfig } from '../lcconfig.js';

export class LcWebSocket implements LanguageClientConnectionRealization {
  private support?: LanguageClientConnectionSupport;
  private connectionConfig?: ConnectionConfig;
  private languageId: string = 'unknown';
  private webSocket?: WebSocket;
  private messageTransports?: MessageTransports;

  getLanguageId(): string {
    return this.languageId;
  }

  getTransportLayerName(): string {
    return 'WebSocket';
  }

  getMessageTransports(): MessageTransports | undefined {
    return this.messageTransports;
  }

  async init(languageId: string, connectionConfig: ConnectionConfig, support: LanguageClientConnectionSupport): Promise<MessageTransports> {
    this.languageId = languageId;
    this.connectionConfig = connectionConfig;
    this.support = support;
    this.support.setDisposeResources(connectionConfig.options.disposeResources === true);
    this.support.setRetryConfig(connectionConfig.retryConfig);

    const options = connectionConfig.options as WebSocketConfigOptionsParams | WebSocketConfigOptionsUrl;
    this.webSocket = new WebSocket(createUrl(options));

    this.messageTransports = {
      reader: new WebSocketMessageReader(this.webSocket),
      writer: new WebSocketMessageWriter(this.webSocket)
    };
    return this.messageTransports;
  }

  start(): Promise<void> {
    const connectionEstablished: Deferred<void> = new Deferred<void>();

    this.support?.clearPendingTimeout();
    this.support?.createConnectionTimeout(
      this.connectionConfig?.retryConfig?.timeout ?? DEFAULT_CONNECTION_TIMEOUT,
      this.webSocket?.readyState !== WebSocket.OPEN,
      connectionEstablished.reject
    );

    // if websocket is already open, signal immediately
    if (this.webSocket?.readyState === WebSocket.OPEN) {
      this.support?.clearPendingTimeout();
      connectionEstablished.resolve();
    }

    // otherwise start on open
    if (this.webSocket !== undefined) {
      this.webSocket.onerror = (ev: Event) => {
        const error = this.support?.createError('Websocket connection failed', ev);
        connectionEstablished.reject(error);
        this.disconnected();
      };

      this.webSocket.onopen = async () => {
        this.support?.clearPendingTimeout();
        connectionEstablished.resolve();
      };

      this.webSocket.onclose = async () => {
        this.disconnected();
      };
    }

    return connectionEstablished.promise;
  }

  disconnected: () => void;

  restart(_count: number): void {
    if (this.support?.disposeOnRestart() === true) {
      this.webSocket?.close();
      this.webSocket = undefined;
    }
  }

  dispose(): void {
    if (this.support?.getDisposeResources() === true) {
      this.webSocket?.close();
      this.webSocket = undefined;
    }
  }
}

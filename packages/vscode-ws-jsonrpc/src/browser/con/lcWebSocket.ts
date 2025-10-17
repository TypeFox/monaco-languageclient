/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { createUrl, type WebSocketConfigOptionsParams, type WebSocketConfigOptionsUrl } from 'monaco-languageclient/common';
import {
  DEFAULT_CONNECTION_TIMEOUT,
  LanguageClientConnectionSupport,
  type ConnectionConfig,
  type LanguageClientConnectionRealization
} from 'monaco-languageclient/lcwrapper';
import type { MessageTransports } from 'vscode-languageclient';
import { WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';

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

  start(errorHandler: (reason?: unknown) => void): void {
    this.support?.clearPendingTimeout();
    this.support?.createConnectionTimeout(
      this.connectionConfig?.retryConfig?.timeout ?? DEFAULT_CONNECTION_TIMEOUT,
      this.webSocket?.readyState !== WebSocket.OPEN,
      errorHandler
    );

    // if websocket is already open, signal immediately
    if (this.webSocket?.readyState === WebSocket.OPEN) {
      this.support?.clearPendingTimeout();
      this.connected();
    }

    // otherwise start on open
    if (this.webSocket !== undefined) {
      this.webSocket.onerror = (ev: Event) => {
        const error = this.support?.createError('Websocket connection failed', ev);
        errorHandler(error);
      };

      this.webSocket.onopen = async () => {
        this.support?.clearPendingTimeout();
        this.connected();
      };

      this.webSocket.onclose = async () => {
        this.disconnected();
      };
    }
  }

  connected: () => void;

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

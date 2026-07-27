/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
  createUrl,
  type WebSocketConfigOptionsDirect,
  type WebSocketConfigOptionsParams,
  type WebSocketConfigOptionsUrl
} from 'monaco-languageclient/common';
import {
  DEFAULT_CONNECTION_TIMEOUT,
  type LanguageClientConnectionRealization,
  LanguageClientConnectionSupport,
  type ConnectionConfig,
  type TransportLayerName
} from 'monaco-languageclient/lcwrapper';
import { WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import type { MessageTransports } from 'vscode-languageclient';

export class LcWebSocket implements LanguageClientConnectionRealization {
  private support: LanguageClientConnectionSupport;
  private languageId: string = 'unknown';
  private webSocket?: WebSocket;

  constructor() {
    this.support = new LanguageClientConnectionSupport(this);
  }

  getLanguageId(): string {
    return this.languageId;
  }

  getTransportLayerName(): TransportLayerName {
    return 'WebSocket';
  }

  init(languageId: string, connectionConfig: ConnectionConfig, errorHandler: (reason?: unknown) => void): void {
    this.languageId = languageId;
    const options = connectionConfig.options;
    this.webSocket = options.direct
      ? ((options as WebSocketConfigOptionsDirect).webSocket as WebSocket)
      : new WebSocket(createUrl(options as WebSocketConfigOptionsParams | WebSocketConfigOptionsUrl));

    this.support.clearPendingTimeout();
    this.support.createConnectionTimeout(
      connectionConfig.timeout ?? DEFAULT_CONNECTION_TIMEOUT,
      this.webSocket.readyState !== WebSocket.OPEN,
      errorHandler
    );

    this.webSocket.onerror = (ev: Event) => {
      this.support.createError(ev, 'Websocket connection failed', errorHandler);
    };

    const messageTransports = connectionConfig.messageTransports ?? {
      reader: new WebSocketMessageReader(this.webSocket),
      writer: new WebSocketMessageWriter(this.webSocket)
    };

    // if websocket is already open, signal immediately
    if (this.webSocket.readyState === WebSocket.OPEN) {
      this.support.clearPendingTimeout();
      this.connected(messageTransports);
    }

    // otherwise start on open
    this.webSocket.onopen = async () => {
      this.support.clearPendingTimeout();
      this.connected(messageTransports);
    };

    this.webSocket.onclose = async () => {
      this.disconnected();
    };
  }

  connected: (messageTransports: MessageTransports) => void;

  disconnected: () => void;

  dispose(): void {
    this.webSocket?.close();
  }
}

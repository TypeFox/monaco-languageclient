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
  type ConnectionConfig,
  LanguageClientConnectionRealization,
  type TransportLayerName
} from 'monaco-languageclient/lcwrapper';
import { WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';

export class LcWebSocket extends LanguageClientConnectionRealization {
  private webSocket?: WebSocket;

  getTransportLayerName(): TransportLayerName {
    return 'WebSocket';
  }

  init(languageId: string, connectionConfig: ConnectionConfig, errorHandler: (reason?: unknown) => void): void {
    this.languageId = languageId;
    const options = connectionConfig.options;
    this.webSocket = options.direct
      ? ((options as WebSocketConfigOptionsDirect).webSocket as WebSocket)
      : new WebSocket(createUrl(options as WebSocketConfigOptionsParams | WebSocketConfigOptionsUrl));

    this.clearPendingTimeout();
    this.createConnectionTimeout(
      connectionConfig.timeout ?? DEFAULT_CONNECTION_TIMEOUT,
      this.webSocket.readyState !== WebSocket.OPEN,
      errorHandler
    );

    this.webSocket.onerror = (ev: Event) => {
      this.createError(ev, 'Websocket connection failed', errorHandler);
    };

    const messageTransports = connectionConfig.messageTransports ?? {
      reader: new WebSocketMessageReader(this.webSocket),
      writer: new WebSocketMessageWriter(this.webSocket)
    };

    // if websocket is already open, signal immediately
    if (this.webSocket.readyState === WebSocket.OPEN) {
      this.clearPendingTimeout();
      this.connected(messageTransports);
    }

    // otherwise start on open
    this.webSocket.onopen = async () => {
      this.clearPendingTimeout();
      this.connected(messageTransports);
    };

    this.webSocket.onclose = async () => {
      this.disconnected();
    };
  }

  dispose(): void {
    this.webSocket?.close();
  }
}

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { MessageTransports } from 'vscode-languageclient/browser.js';
import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import type { WebSocketConfigOptionsDirect, WebSocketConfigOptionsParams, WebSocketConfigOptionsUrl } from '../../common/commonTypes.js';
import { createUrl } from '../../common/utils.js';
import type { ConnectionConfig } from '../lcconfig.js';
import type { LanguageClientError } from '../lcwrapper.js';
import type { LanguageClientConnectionRealization, TransportLayerName } from './contract.js';

export class LcWebSocket implements LanguageClientConnectionRealization {
  connected: () => void;
  disconnected: () => void;
  private languageId: string = 'unknown';
  private webSocket?: WebSocket;

  getTransportLayerName(): TransportLayerName {
    return 'WebSocket';
  }

  reinit(languageId: string, connectionConfig: ConnectionConfig): MessageTransports {
    this.languageId = languageId;
    const options = connectionConfig.options as WebSocketConfigOptionsUrl | WebSocketConfigOptionsParams | WebSocketConfigOptionsDirect;
    this.webSocket = options.$type === 'WebSocketDirect' ? (options.webSocket as WebSocket) : new WebSocket(createUrl(options));

    let messageTransports = connectionConfig.messageTransports;
    if (messageTransports === undefined) {
      const iWebSocket = toSocket(this.webSocket as WebSocket);
      messageTransports = {
        reader: new WebSocketMessageReader(iWebSocket),
        writer: new WebSocketMessageWriter(iWebSocket)
      };
    }
    return messageTransports;
  }

  configureConnectionHandling(): void {
    if (this.webSocket !== undefined) {
      // if websocket is already open, then start the languageclient directly
      if (this.webSocket.readyState === WebSocket.OPEN) {
        this.connected();
      }

      // otherwise start on open
      this.webSocket.onopen = async () => {
        this.connected();
      };
    }
  }

  configureErrorHandling(handler: (reason?: unknown) => void): void {
    if (this.webSocket !== undefined) {
      this.webSocket.onerror = (ev: Event) => {
        const languageClientError: LanguageClientError = {
          message: `LcWebSocket (${this.languageId}) created an error.`,
          error: (ev as ErrorEvent).error ?? 'No error was provided.'
        };
        handler(languageClientError);
      };
    }
  }

  dispose(): void {}
}

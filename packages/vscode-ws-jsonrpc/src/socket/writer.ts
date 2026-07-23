/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { AbstractMessageWriter, Message, MessageWriter } from 'vscode-jsonrpc';
import { toSocket } from './connection.js';
import type { IWebSocket } from '../common/types.js';

export class WebSocketMessageWriter extends AbstractMessageWriter implements MessageWriter {
  protected errorCount = 0;
  protected readonly socket: IWebSocket;

  constructor(webSocket: WebSocket | IWebSocket) {
    super();
    this.socket = Object.hasOwn(webSocket, '$type') ? (webSocket as IWebSocket) : toSocket(webSocket as WebSocket);
  }

  end(): void {}

  async write(msg: Message): Promise<void> {
    try {
      const content = JSON.stringify(msg);
      this.socket.send(content);
    } catch (e) {
      this.errorCount++;
      this.fireError(e, msg, this.errorCount);
    }
  }
}

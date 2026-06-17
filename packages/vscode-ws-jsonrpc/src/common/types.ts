/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Disposable, Message, MessageReader, MessageWriter } from 'vscode-jsonrpc';

export interface IConnection extends Disposable {
  readonly reader: MessageReader;
  readonly writer: MessageWriter;
  forward(to: IConnection, map?: (message: Message) => Message): void;
  onClose(callback: () => void): Disposable;
}

export interface IWebSocket extends Disposable {
  send(content: string): void;
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  onMessage(cb: (data: any) => void): void;
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  onError(cb: (reason: any) => void): void;
  onClose(cb: (code: number, reason: string) => void): void;
}

export interface IWebSocketConnection extends IConnection {
  readonly socket: IWebSocket;
}

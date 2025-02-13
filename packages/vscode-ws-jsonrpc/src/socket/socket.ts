/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Disposable } from 'vscode-jsonrpc';
import type { IConnection } from '../server/connection.js';

export interface IWebSocket extends Disposable {
    send(content: string): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onMessage(cb: (data: any) => void): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError(cb: (reason: any) => void): void;
    onClose(cb: (code: number, reason: string) => void): void;
}

export interface IWebSocketConnection extends IConnection {
    readonly socket: IWebSocket;
}

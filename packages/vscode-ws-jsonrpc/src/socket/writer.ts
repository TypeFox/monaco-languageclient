/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Message } from 'vscode-jsonrpc';
import { AbstractMessageWriter, MessageWriter } from 'vscode-jsonrpc';
import type { IWebSocket } from './socket.js';

export class WebSocketMessageWriter extends AbstractMessageWriter implements MessageWriter {
    protected errorCount = 0;
    protected readonly socket: IWebSocket;

    constructor(socket: IWebSocket) {
        super();
        this.socket = socket;
    }

    end(): void {
    }

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

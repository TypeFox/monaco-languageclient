/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { Socket } from 'socket.io';
import type { Socket as SocketClient } from 'socket.io-client';
import { AbstractMessageWriter, Message, MessageWriter } from 'vscode-jsonrpc';

export class SocketIoMessageWriter extends AbstractMessageWriter implements MessageWriter {
    protected errorCount = 0;
    protected readonly socket: Socket | SocketClient;

    constructor(socket: Socket | SocketClient) {
        super();
        this.socket = socket as Socket | SocketClient;
    }

    end(): void {
        // The socket is managed externally, so we don't close it here.
    }

    async write(msg: Message): Promise<void> {
        try {
            const content = JSON.stringify(msg);
            this.socket.send(content);
        } catch (e) {
            const error = e instanceof Error ? e : new Error(`Failed to write message: ${e}`);
            this.errorCount++;
            this.fireError(error, msg, this.errorCount);
        }
    }
}

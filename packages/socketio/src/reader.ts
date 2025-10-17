/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { Socket } from 'socket.io';
import type { Socket as SocketClient } from 'socket.io-client';
import { AbstractMessageReader, type DataCallback, type Disposable, MessageReader } from 'vscode-jsonrpc';

export class SocketIoMessageReader extends AbstractMessageReader implements MessageReader {
    protected readonly socket: Socket | SocketClient;
    protected callbacks = new Set<DataCallback>();

    constructor(socket: Socket | SocketClient) {
        super();
        this.socket = socket as Socket | SocketClient;

        this.socket.on('message', (data: string | object) => {
            this.onMessage(data);
        });
        this.socket.on('error', (error) => {
            this.fireError(error);
        });
        this.socket.on('disconnect', () => {
            this.fireClose();
        });
    }

    listen(callback: DataCallback): Disposable {
        this.callbacks.add(callback);
        return {
            dispose: () => {
                this.callbacks.forEach(callback => this.callbacks.delete(callback));
            }
        };
    }

    protected onMessage(data: string | object): void {
        if (this.callbacks.size === 0) {
            return;
        }
        try {
            const message = typeof data === 'string' ? JSON.parse(data) : data;
            this.callbacks.forEach(callback => callback(message));
        } catch (e) {
            const error = e instanceof Error ? e : new Error(`Failed to parse message: ${e}`);
            this.fireError(error);
        }
    }
}

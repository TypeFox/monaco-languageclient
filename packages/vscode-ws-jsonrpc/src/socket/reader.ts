/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Disposable } from 'vscode-jsonrpc';
import { DataCallback, AbstractMessageReader, MessageReader } from 'vscode-jsonrpc/lib/common/messageReader.js';
import { IWebSocket } from './socket.js';

export class WebSocketMessageReader extends AbstractMessageReader implements MessageReader {
    protected readonly socket: IWebSocket;
    protected state: 'initial' | 'listening' | 'closed' = 'initial';
    protected callback: DataCallback | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected readonly events: Array<{ message?: any, error?: any }> = [];

    constructor(socket: IWebSocket) {
        super();
        this.socket = socket;
        this.socket.onMessage(message =>
            this.readMessage(message)
        );
        this.socket.onError(error =>
            this.fireError(error)
        );
        this.socket.onClose((code, reason) => {
            if (code !== 1000) {
                const error: Error = {
                    name: '' + code,
                    message: `Error during socket reconnect: code = ${code}, reason = ${reason}`
                };
                this.fireError(error);
            }
            this.fireClose();
        });
    }

    listen(callback: DataCallback): Disposable {
        if (this.state === 'initial') {
            this.state = 'listening';
            this.callback = callback;
            while (this.events.length !== 0) {
                const event = this.events.pop()!;
                if (event.message) {
                    this.readMessage(event.message);
                } else if (event.error) {
                    this.fireError(event.error);
                } else {
                    this.fireClose();
                }
            }
        }
        return {
            dispose: () => {
                if (this.callback === callback) {
                    this.state = 'initial';
                    this.callback = undefined;
                }
            }
        };
    }

    override dispose() {
        super.dispose();
        this.state = 'initial';
        this.callback = undefined;
        this.events.splice(0, this.events.length);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected readMessage(message: any): void {
        if (this.state === 'initial') {
            this.events.splice(0, 0, { message });
        } else if (this.state === 'listening') {
            try {
                const data = JSON.parse(message);
                this.callback!(data);
            } catch (err) {
                const error: Error = {
                    name: '' + 400,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    message: `Error during message parsing, reason = ${typeof err === 'object' ? (err as any).message : 'unknown'}`
                };
                this.fireError(error);
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected override fireError(error: any): void {
        if (this.state === 'initial') {
            this.events.splice(0, 0, { error });
        } else if (this.state === 'listening') {
            super.fireError(error);
        }
    }

    protected override fireClose(): void {
        if (this.state === 'initial') {
            this.events.splice(0, 0, {});
        } else if (this.state === 'listening') {
            super.fireClose();
        }
        this.state = 'closed';
    }
}

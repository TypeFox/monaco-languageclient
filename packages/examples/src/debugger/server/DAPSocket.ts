/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as net from 'node:net';

// This is derived from:
// https://github.com/CodinGame/monaco-vscode-api/blob/main/demo/src/debugServer.ts

const TWO_CRLF = '\r\n\r\n';
const HEADER_LINESEPARATOR = /\r?\n/;
const HEADER_FIELDSEPARATOR = /: */;

export class DAPSocket {
    private socket: net.Socket;
    private rawData = Buffer.allocUnsafe(0);
    private contentLength = -1;
    private onMessage: (message: string) => void;

    constructor(onMessage: (message: string) => void) {
        this.onMessage = onMessage;
        this.socket = new net.Socket();
        this.socket.on('data', this.onData);
    }

    private onData = (data: Buffer) => {
        this.rawData = Buffer.concat([this.rawData, data]);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (true) {
            if (this.contentLength >= 0) {
                if (this.rawData.length >= this.contentLength) {
                    const message = this.rawData.toString('utf8', 0, this.contentLength);
                    this.rawData = this.rawData.subarray(this.contentLength);
                    this.contentLength = -1;
                    if (message.length > 0) {
                        this.onMessage(message);
                    }
                    continue;
                }
            } else {
                const idx = this.rawData.indexOf(TWO_CRLF);
                if (idx !== -1) {
                    const header = this.rawData.toString('utf8', 0, idx);
                    const lines = header.split(HEADER_LINESEPARATOR);
                    for (const h of lines) {
                        const kvPair = h.split(HEADER_FIELDSEPARATOR);
                        if (kvPair[0] === 'Content-Length') {
                            this.contentLength = Number(kvPair[1]);
                        }
                    }
                    this.rawData = this.rawData.subarray(idx + TWO_CRLF.length);
                    continue;
                }
            }
            break;
        }
    };

    public connect(port: number) {
        this.socket.connect(port);
    }

    public sendMessage(message: string) {
        console.log(`Client->DAP: ${message}`);
        this.socket.write(`Content-Length: ${Buffer.byteLength(message, 'utf8')}${TWO_CRLF}${message}`, 'utf8');
    }
}

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

// This is derived from:
// https://github.com/CodinGame/monaco-vscode-api/blob/main/demo/src/debugServer.ts
// the major difference is that the debug server runs already inside the container

import express from 'express';
import { WebSocketServer } from 'ws';
import * as http from 'node:http';
import * as net from 'node:net';
import * as fs from 'node:fs';
import type { InitMessage } from '../common/definitions.js';
import { exec } from 'node:child_process';

async function exitHandler() {
    console.log('Exiting...');
}
process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);
process.on('uncaughtException', exitHandler);

class DAPSocket {
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
        this.socket.write(
            `Content-Length: ${Buffer.byteLength(message, 'utf8')}${TWO_CRLF}${message}`,
            'utf8'
        );
    }
}

const TWO_CRLF = '\r\n\r\n';
const HEADER_LINESEPARATOR = /\r?\n/;
const HEADER_FIELDSEPARATOR = /: */;

const PORT = 5555;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function sequential<T, P extends unknown[]>(
    fn: (...params: P) => Promise<T>
): (...params: P) => Promise<T> {
    let promise = Promise.resolve();
    return (...params: P) => {
        const result = promise.then(() => {
            return fn(...params);
        });

        promise = result.then(
            () => { },
            () => { }
        );
        return result;
    };
}

wss.on('connection', (ws) => {
    const onWsMessage = (message: string) => {
        console.log(`DAP->Client: ${message}`);
        ws.send(message);
    };
    const socket = new DAPSocket(onWsMessage);

    let initialized = false;

    ws.on(
        'message',
        sequential(async (message: string) => {
            if (!initialized) {
                try {
                    const parsed = JSON.parse(message);
                    if (parsed.id === 'init') {
                        const initMesssage = parsed as InitMessage;
                        const defaultFile = initMesssage.defaultFile;
                        for (const [name, fileDef] of Object.entries(initMesssage.files)) {
                            console.log(`Found file: ${name} path: ${fileDef.path}`);
                            await fs.promises.writeFile(fileDef.path, fileDef.code);
                        }
                        initialized = true;

                        console.log(`Using default file "${defaultFile}" for debugging.`);

                        const sendOutput = (category: 'stdout' | 'stderr', output: string | null | undefined) => {
                            onWsMessage(
                                JSON.stringify({
                                    type: 'event',
                                    event: 'output',
                                    body: {
                                        category,
                                        output
                                    }
                                })
                            );
                        };
                        const execGraalpy = await exec(`graalpy --dap --dap.WaitAttached --dap.Suspend=false ${defaultFile} 2>&1 | tee /home/mlc/server/graalpy.log`);
                        execGraalpy.stdout?.on('data', (data) => {
                            sendOutput('stdout', data);
                        });
                        execGraalpy.stderr?.on('data', (data) => {
                            sendOutput('stderr', data);
                        });
                        execGraalpy.on('error', (err) => {
                            sendOutput('stderr', err.message);
                        });
                        execGraalpy.on('end', () => {
                            ws.close();
                        });

                        await new Promise((resolve) => setTimeout(resolve, 1000));
                        // 4711 is the default port of the GraalPy debugger
                        socket.connect(4711);
                        return;
                    }
                } catch (err) {
                    console.error('Failed to initialize', err);
                }
            }
            socket.sendMessage(message);
        })
    );
});

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}!`);
});

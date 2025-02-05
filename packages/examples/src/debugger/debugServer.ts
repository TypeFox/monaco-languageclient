/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

// this is derived from:
// https://github.com/CodinGame/monaco-vscode-api/blob/main/demo/src/debugServer.ts
// the major difference is that the debug server runs already inside the container

import express from 'express';
import { WebSocketServer } from 'ws';
import * as http from 'node:http';
import * as net from 'node:net';
import * as fs from 'node:fs';

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

// async function findPortFree() {
//     return await new Promise<number>((resolve) => {
//         const srv = net.createServer();
//         srv.listen(0, () => {
//             const port = (srv.address() as net.AddressInfo).port;
//             srv.close(() => resolve(port));
//         });
//     });
// }

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
    const socket = new DAPSocket((message) => ws.send(message));

    let initialized = false;

    ws.on(
        'message',
        sequential(async (message: string) => {
            if (!initialized) {
                try {
                    initialized = true;
                    const init: { main: string; files: Record<string, string> } = JSON.parse(message);
                    for (const [file, content] of Object.entries(init.files)) {
                        await fs.promises.writeFile('/tmp/' + file, content);
                    }
                    // const debuggerPort = await findPortFree();
                    // const exec = await exec({
                    //     Cmd: [
                    //         'node',
                    //         `--dap=${debuggerPort}`,
                    //         '--dap.WaitAttached',
                    //         '--dap.Suspend=false',
                    //         `${init.main}`
                    //     ],
                    //     AttachStdout: true,
                    //     AttachStderr: true
                    // });

                    // const execStream = await exec.start({
                    //     hijack: true
                    // });
                    // const stdout = new stream.PassThrough();
                    // const stderr = new stream.PassThrough();
                    // container.modem.demuxStream(execStream, stdout, stderr);
                    // function sendOutput(category: 'stdout' | 'stderr', output: Buffer) {
                    //     ws.send(
                    //         JSON.stringify({
                    //             type: 'event',
                    //             event: 'output',
                    //             body: {
                    //                 category,
                    //                 output: output.toString()
                    //             }
                    //         })
                    //     );
                    // }
                    // stdout.on('data', sendOutput.bind(undefined, 'stdout'));
                    // stderr.on('data', sendOutput.bind(undefined, 'stderr'));

                    // execStream.on('end', () => {
                    //     ws.close();
                    // });

                    // await new Promise((resolve) => setTimeout(resolve, 1000));
                    // socket.connect(debuggerPort);

                    return;
                } catch (err) {
                    console.error('Failed to initialize', err);
                }
            }
            socket.sendMessage(message);
        })
    );
});

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

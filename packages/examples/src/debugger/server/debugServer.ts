/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as http from 'node:http';
import * as fs from 'node:fs';
import { exec } from 'node:child_process';
import express from 'express';
import { WebSocketServer } from 'ws';
import type { InitMessage } from '../common/definitions.js';
import { DAPSocket } from './DAPSocket.js';

// This is derived from:
// https://github.com/CodinGame/monaco-vscode-api/blob/main/demo/src/debugServer.ts
// the major difference is that the debug server runs already inside the container

const exitHandler = async () => {
    console.log('Exiting...');
};
process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);
process.on('uncaughtException', exitHandler);

// the port is fixed, it can be remapped via the docker compose config
const PORT = 5555;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const sequential = <T, P extends unknown[]>(
    fn: (...params: P) => Promise<T>
): (...params: P) => Promise<T> => {
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
};

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
                        const debuggerExecCall = initMesssage.debuggerExecCall;
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

                        const cmd = `${debuggerExecCall} ${defaultFile} 2>&1 | tee /home/mlc/server/debugger.log`;
                        console.log(`Executing the debugger: ${cmd}`);
                        const execGraalpy = await exec(cmd);
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

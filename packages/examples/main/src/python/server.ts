/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import { Socket } from 'net';
import express from 'express';
import { resolve } from 'path';
import { IWebSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import { createConnection, createServerProcess, forward } from 'vscode-ws-jsonrpc/server';
import { Message, InitializeRequest, InitializeParams } from 'vscode-languageserver';
import { getLocalDirectory } from '../utils/fs-utils.js';

const serverName = 'PYRIGHT';

const launchLanguageServer = (socket: IWebSocket) => {
    // start the language server as an external process
    const ls = resolve(getLocalDirectory(import.meta.url), '../../../../../node_modules/pyright/dist/pyright-langserver.js');
    const serverConnection = createServerProcess(serverName, 'node', [ls, '--stdio']);

    const reader = new WebSocketMessageReader(socket);
    const writer = new WebSocketMessageWriter(socket);
    const socketConnection = createConnection(reader, writer, () => socket.dispose());
    if (serverConnection) {
        forward(socketConnection, serverConnection, message => {
            if (Message.isRequest(message)) {
                console.log(`${serverName} Server received:`);
                console.log(message);
                if (message.method === InitializeRequest.type.method) {
                    const initializeParams = message.params as InitializeParams;
                    initializeParams.processId = process.pid;
                }
            }
            if (Message.isResponse(message)) {
                console.log(`${serverName} Server sent:`);
                console.log(message);
            }
            return message;
        });
    }
};

const run = () => {
    process.on('uncaughtException', function(err: any) {
        console.error('Uncaught Exception: ', err.toString());
        if (err.stack) {
            console.error(err.stack);
        }
    });

    // create the express application
    const app = express();
    // server the static content, i.e. index.html
    const dir = getLocalDirectory(import.meta.url);
    app.use(express.static(dir));
    // start the server
    const server = app.listen(30000);
    // create the web socket
    const wss = new WebSocketServer({
        noServer: true,
        perMessageDeflate: false,
        clientTracking: true,
        verifyClient: (
            clientInfo: { origin: string; secure: boolean; req: IncomingMessage },
            callback
        ) => {
            const parsedURL = new URL(`${clientInfo.origin}${clientInfo.req?.url ?? ''}`);
            const authToken = parsedURL.searchParams.get('authorization');
            if (authToken === 'UserAuth') {
                // eslint-disable-next-line n/no-callback-literal
                callback(true);
            } else {
                // eslint-disable-next-line n/no-callback-literal
                callback(false);
            }
        }
    });

    server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
        const baseURL = `http://${request.headers.host}/`;
        const pathname = request.url ? new URL(request.url, baseURL).pathname : undefined;
        if (pathname === '/pyright') {
            wss.handleUpgrade(request, socket, head, webSocket => {
                const socket: IWebSocket = {
                    send: content => webSocket.send(content, error => {
                        if (error) {
                            throw error;
                        }
                    }),
                    onMessage: cb => webSocket.on('message', (data) => {
                        cb(data);
                    }),
                    onError: cb => webSocket.on('error', cb),
                    onClose: cb => webSocket.on('close', cb),
                    dispose: () => webSocket.close()
                };
                // launch the server when the web socket is opened
                if (webSocket.readyState === webSocket.OPEN) {
                    launchLanguageServer(socket);
                } else {
                    webSocket.on('open', () => {
                        launchLanguageServer(socket);
                    });
                }
            });
        }
    });
};

run();

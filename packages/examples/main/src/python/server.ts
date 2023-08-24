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

const launchLanguageServer = (socket: IWebSocket) => {
    // start the language server as an external process
    const serverName = 'PYRIGHT';
    const ls = resolve(getLocalDirectory(import.meta.url), '../../../../../node_modules/pyright/dist/pyright-langserver.js');
    const serverProcesses = createServerProcess(serverName, 'node', [ls, '--stdio']);
    if (serverProcesses?.serverProcess?.stdout !== null) {
        serverProcesses?.serverProcess?.stdout.on('data', data =>
            console.log(`${serverName} Server: ${data}`)
        );
    }

    const reader = new WebSocketMessageReader(socket);
    const writer = new WebSocketMessageWriter(socket);
    const socketConnection = createConnection(reader, writer, () => socket.dispose());
    if (serverProcesses?.connection) {
        forward(socketConnection, serverProcesses.connection, message => {
            if (Message.isRequest(message)) {
                console.log(message);
                if (message.method === InitializeRequest.type.method) {
                    const initializeParams = message.params as InitializeParams;
                    initializeParams.processId = process.pid;
                }
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
        perMessageDeflate: false
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
                        console.log(data.toString());
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

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { resolve } from 'path';
import { WebSocketServer } from 'ws';
import { IncomingMessage, Server } from 'http';
import { URL } from 'url';
import { Socket } from 'net';
import { IWebSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import { createConnection, createServerProcess, forward } from 'vscode-ws-jsonrpc/server';
import { Message, InitializeRequest, InitializeParams } from 'vscode-languageserver';

/**
 * start the language server inside the current process
 */
export const launchLanguageServer = (serverName: string, socket: IWebSocket, baseDir: string, relativeDir: string) => {
    // start the language server as an external process
    const ls = resolve(baseDir, relativeDir);
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

export const upgradeWsServer = (config: {
    serverName: string,
    pathName: string,
    server: Server,
    wss: WebSocketServer,
    baseDir: string,
    relativeDir: string
}) => {
    config.server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
        const baseURL = `http://${request.headers.host}/`;
        const pathName = request.url ? new URL(request.url, baseURL).pathname : undefined;
        if (pathName === config.pathName) {
            config.wss.handleUpgrade(request, socket, head, webSocket => {
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
                    launchLanguageServer(config.serverName, socket, config.baseDir, config.relativeDir);
                } else {
                    webSocket.on('open', () => {
                        launchLanguageServer(config.serverName, socket, config.baseDir, config.relativeDir);
                    });
                }
            });
        }
    });
};

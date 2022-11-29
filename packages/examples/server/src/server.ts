/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { WebSocketServer } from 'ws';
import * as http from 'http';
import { fileURLToPath, URL } from 'url';
import * as net from 'net';
import express from 'express';
import * as rpc from 'vscode-ws-jsonrpc';
import { launch } from './json-server-launcher.js';

// solve: __dirname is not defined in ES module scope
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on('uncaughtException', function(err: any) {
    console.error('Uncaught Exception: ', err.toString());
    if (err.stack) {
        console.error(err.stack);
    }
});

// create the express application
const app = express();
// server the static content, i.e. index.html
app.use(express.static(__dirname));
// start the server
const server = app.listen(3000);
// create the web socket
const wss = new WebSocketServer({
    noServer: true,
    perMessageDeflate: false
});
server.on('upgrade', (request: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
    const baseURL = `http://${request.headers.host}/`;
    const pathname = request.url ? new URL(request.url, baseURL).pathname : undefined;
    if (pathname === '/sampleServer') {
        wss.handleUpgrade(request, socket, head, webSocket => {
            const socket: rpc.IWebSocket = {
                send: content => webSocket.send(content, error => {
                    if (error) {
                        throw error;
                    }
                }),
                onMessage: cb => webSocket.on('message', cb),
                onError: cb => webSocket.on('error', cb),
                onClose: cb => webSocket.on('close', cb),
                dispose: () => webSocket.close()
            };
            // launch the server when the web socket is opened
            if (webSocket.readyState === webSocket.OPEN) {
                launch(socket);
            } else {
                webSocket.on('open', () => launch(socket));
            }
        });
    }
});

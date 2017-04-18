/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as ws from "ws";
import * as http from "http";
import * as url from "url";
import * as net from "net";
import * as express from "express";
import { Socket, SocketMessageReader, SocketMessageWriter } from "vscode-ws-jsonrpc";
import { createConnection } from "vscode-languageserver";
import { JsonServer } from "./json-server";

process.on('uncaughtException', function (err: any) {
    console.error('Uncaught Exception: ', err.toString());
    if (err.stack) {
        console.error(err.stack);
    }
});

function onOpen(socket: Socket): void {
    const reader = new SocketMessageReader(socket);
    const writer = new SocketMessageWriter(socket);
    const connection = createConnection(reader, writer);
    const server = new JsonServer(connection);
    server.start();
}

const app = express();
app.use(express.static(__dirname));
const server = app.listen(3000);
const wss = new ws.Server({
    noServer: true,
    perMessageDeflate: false
});
server.on('upgrade', (request: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
    const pathname = request.url ? url.parse(request.url).pathname : undefined;
    if (pathname === '/sampleServer') {
        wss.handleUpgrade(request, socket, head, webSocket => {
            const socket: Socket = {
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
            if (webSocket.readyState === webSocket.OPEN) {
                onOpen(socket);
            } else {
                webSocket.on('open', () => onOpen(socket));
            }
        });
    }
})
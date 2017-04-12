import * as ws from "ws";
import * as http from "http";
import * as url from "url";
import * as path from "path";
import * as net from "net";
import * as express from "express";
import { Socket, SocketMessageReader, SocketMessageWriter } from "monaco-languageclient/lib/socket";
import { ConsoleLogger } from "monaco-languageclient/lib/logger";
import { createConnection, IConnection, TextDocuments } from "vscode-languageserver";

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

    const documents: TextDocuments = new TextDocuments();
    documents.listen(connection);

    connection.onInitialize(params => {
        return {
            capabilities: {
                textDocumentSync: documents.syncKind
            }
        }
    });

    connection.listen();
}
const app = express();
app.use(express.static(__dirname));
const server = app.listen(3000);
const wss = new ws.Server({
    noServer: true,
    perMessageDeflate: false
});
const logger = new ConsoleLogger();
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
/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as path from 'path';
import { SocketMessageReader, SocketMessageWriter, Socket } from "vscode-ws-jsonrpc";
import { isRequestMessage } from "vscode-jsonrpc/lib/messages";
import { createServerProcess, forward, createConnection as createSocketConnection } from "vscode-ws-jsonrpc/lib/server";
import { InitializeRequest, InitializeParams } from "vscode-languageserver";
import { start } from "./json-server";

export function launch(socket: Socket) {
    const reader = new SocketMessageReader(socket);
    const writer = new SocketMessageWriter(socket);
    const asExternalProccess = process.argv.findIndex(value => value === '--external');
    if (asExternalProccess)  {
        const extJsonServerPath = path.resolve(__dirname, 'ext-json-server.js');
        const socketConnection = createSocketConnection(reader, writer, () => socket.dispose());
        const serverConnection = createServerProcess('JSON', 'node', [extJsonServerPath]);
        forward(socketConnection, serverConnection, message => {
            if (isRequestMessage(message)) {
                if (message.method === InitializeRequest.type.method) {
                    const initializeParams = message.params as InitializeParams;
                    initializeParams.processId = process.pid;
                }
            }
            return message;
        });
    } else {
        start(reader, writer);
    }
}
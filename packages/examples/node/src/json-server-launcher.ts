/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as path from 'path';
import * as rpc from "@codingame/monaco-jsonrpc";
import * as server from "@codingame/monaco-jsonrpc/lib/server";
import * as lsp from "vscode-languageserver";
import { start } from "./json-server";

export function launch(socket: rpc.IWebSocket) {
    const reader = new rpc.WebSocketMessageReader(socket);
    const writer = new rpc.WebSocketMessageWriter(socket);
    const asExternalProccess = process.argv.findIndex(value => value === '--external') !== -1;
    if (asExternalProccess)  {
        // start the language server as an external process
        const extJsonServerPath = path.resolve(__dirname, 'ext-json-server.js');
        const socketConnection = server.createConnection(reader, writer, () => socket.dispose());
        const serverConnection = server.createServerProcess('JSON', 'node', [extJsonServerPath]);
        server.forward(socketConnection, serverConnection, message => {
            if (rpc.isRequestMessage(message)) {
                if (message.method === lsp.InitializeRequest.type.method) {
                    const initializeParams = message.params as lsp.InitializeParams;
                    initializeParams.processId = process.pid;
                }
            }
            return message;
        });
    } else {
        // start the language server inside the current process
        start(reader, writer);
    }
}

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { MessageConnection, createMessageConnection, Logger } from "vscode-jsonrpc";
import { IWebSocket } from "./socket";
import { WebSocketMessageReader } from "./reader";
import { WebSocketMessageWriter } from "./writer";

export function createWebSocketConnection(socket: IWebSocket, logger: Logger): MessageConnection {
    const messageReader = new WebSocketMessageReader(socket);
    const messageWriter = new WebSocketMessageWriter(socket);
    const connection = createMessageConnection(messageReader, messageWriter, logger);
    connection.onClose(() => connection.dispose());
    return connection;
}

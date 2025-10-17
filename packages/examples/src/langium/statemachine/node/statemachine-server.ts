/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { startLanguageServer } from 'langium/lsp';
import { NodeFileSystem } from 'langium/node';
import type { Socket } from 'socket.io';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js';
import { SocketIoMessageReader, SocketIoMessageWriter } from 'vscode-socketio-jsonrpc';
import { createStatemachineServices } from '../ls/statemachine-module.js';

export const runStatemachineLanguageServer = (socket: Socket) => {
    const reader = new SocketIoMessageReader(socket);
    const writer = new SocketIoMessageWriter(socket);

    // Create a connection for the server, using socket.io directly
    // Also include all preview / proposed LSP features.
    const connection = createConnection(ProposedFeatures.all, reader, writer);

    // Inject the shared services and language-specific services
    const { shared } = createStatemachineServices({ connection, ...NodeFileSystem });

    // Start the language server with the shared services
    startLanguageServer(shared);
};

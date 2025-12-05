/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { startLanguageServer } from 'langium/lsp';
import { NodeFileSystem } from 'langium/node';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js';
import { ConsoleLogger, LogLevel, type MessageTransports } from 'vscode-socketio-jsonrpc';
import { SocketIoServer } from 'vscode-socketio-jsonrpc/node';
import { createStatemachineServices } from '../ls/statemachine-module.js';

const logger = new ConsoleLogger(LogLevel.Debug);

export const runStatemachineLanguageServer = (messageTransports: MessageTransports) => {

    // Create a connection for the server, using socket.io directly
    // Also include all preview / proposed LSP features.
    const connection = createConnection(ProposedFeatures.all, messageTransports.reader, messageTransports.writer);

    // Inject the shared services and language-specific services
    const { shared } = createStatemachineServices({ connection, ...NodeFileSystem });

    // Start the language server with the shared services
    startLanguageServer(shared);
};

// if launched externally
if (process.argv.length > 3 && process.argv[2] === '--stdio' && process.argv[3] === '--socketio') {
    const socketIoServerPassthrough = new SocketIoServer({
        hostname: 'localhost',
        wsPort: 30003,
        corsPort: 20001,
        logLevel: 1,
        messageTransportHandler: (messageTransports) => runStatemachineLanguageServer(messageTransports)
    });
    socketIoServerPassthrough.start();
} else {
    logger.info('If you want to start this as language server standalone, please supply --stdio as argument.');
}

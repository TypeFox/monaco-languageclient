/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { Socket } from 'socket.io';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { createConnection, DidChangeConfigurationNotification, type InitializeParams, type InitializeResult, TextDocuments, TextDocumentSyncKind } from 'vscode-languageserver/node.js';
import { SocketIoMessageReader, SocketIoMessageWriter, LogLevel, ConsoleLogger } from 'vscode-socketio-jsonrpc';
import { SocketIoServer } from 'vscode-socketio-jsonrpc/node';

const logger = new ConsoleLogger(LogLevel.Debug);
/**
 * Derived from:
 * https://code.visualstudio.com/api/language-extensions/language-server-extension-guide
 */
const runLanguageServer = (socket: Socket) => {
    const reader = new SocketIoMessageReader(socket);
    const writer = new SocketIoMessageWriter(socket);

    // Create a connection for the server, using socket.io directly
    // Also include all preview / proposed LSP features.
    const connection = createConnection(reader, writer);

    // Create a simple text document manager.
    const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

    let hasConfigurationCapability: boolean = false;
    let hasWorkspaceFolderCapability: boolean = false;

    connection.onInitialize((params: InitializeParams) => {
        console.log('Server initialized');
        const capabilities = params.capabilities;

        // Does the client support the `workspace/configuration` request?
        // If not, we fall back using global settings.
        hasConfigurationCapability = capabilities.workspace?.configuration ?? false;
        hasWorkspaceFolderCapability = capabilities.workspace?.workspaceFolders ?? false;

        const result: InitializeResult = {
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                // Tell the client that this server supports code completion.
                completionProvider: {
                    resolveProvider: true
                }
            }
        };
        if (hasWorkspaceFolderCapability) {
            result.capabilities.workspace = {
                workspaceFolders: {
                    supported: true
                }
            };
        }
        return result;
    });

    connection.onInitialized(() => {
        if (hasConfigurationCapability) {
            // Register for all configuration changes.
            connection.client.register(DidChangeConfigurationNotification.type, undefined);
        }
        if (hasWorkspaceFolderCapability) {
            connection.workspace.onDidChangeWorkspaceFolders(_event => {
                connection.console.log('Workspace folder change event received.');
            });
        }
    });

    // Make the text document manager listen on the connection
    // for open, change and close text document events
    documents.listen(connection);

    // Listen on the connection
    connection.listen();
};

const runCommanding = async () => {
    const socketIoServerLs = new SocketIoServer({
        hostname: 'localhost',
        wsPort: 30102,
        corsPort: 20101,
        logLevel: 1,
        socketHandler: runLanguageServer
    });

    const commandHandler = (socket: Socket) => {
        let feedback;

        socket.on('ls:start', (cb) => {
            if (!socketIoServerLs.isStarted()) {
                socketIoServerLs.start();
                feedback = 'Language server started.';
                logger.info(feedback);
            } else {
                feedback = 'Language server was already started.';
                logger.info(feedback);
            }
            cb(feedback);
        });
        socket.on('ls:stop', async (cb) => {
            await socketIoServerLs?.shutdown();
            feedback = 'Language server was stopped.';
            logger.info(feedback);
            cb(feedback);
        });
    };

    const socketIoServerCommanding = new SocketIoServer({
        hostname: 'localhost',
        wsPort: 30200,
        corsPort: 20101,
        logLevel: LogLevel.Debug,
        socketHandler: commandHandler
    });
    socketIoServerCommanding.start();
};
runCommanding();

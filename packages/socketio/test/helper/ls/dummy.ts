/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { Socket } from 'socket.io';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { createConnection, DidChangeConfigurationNotification, type InitializeParams, type InitializeResult, ProposedFeatures, TextDocuments, TextDocumentSyncKind } from 'vscode-languageserver/node.js';
import { SocketIoMessageReader, SocketIoMessageWriter } from 'vscode-socketio-jsonrpc';

/**
 * Derived from:
 * https://code.visualstudio.com/api/language-extensions/language-server-extension-guide
 */
export const runDummyLanguageServer = (socket: Socket) => {
    const reader = new SocketIoMessageReader(socket);
    const writer = new SocketIoMessageWriter(socket);

    // Create a connection for the server, using socket.io directly
    // Also include all preview / proposed LSP features.
    const connection = createConnection(ProposedFeatures.all, reader, writer);

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

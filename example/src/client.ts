/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { BaseLanguageClient as LanguageClient, CloseAction, ErrorAction } from 'vscode-base-languageclient/lib/base';
import { createConnection } from "vscode-base-languageclient/lib/connection";
import { listen, MessageConnection } from 'vscode-ws-jsonrpc';
import {
    MonacoToProtocolConverter, ProtocolToMonacoConverter,
    MonacoLanguages, MonacoWorkspace,
} from 'monaco-languageclient';
const ReconnectingWebSocket = require('reconnecting-websocket');

// register Monaco languages
monaco.languages.register({
    id: 'json',
    extensions: ['.json', '.bowerrc', '.jshintrc', '.jscsrc', '.eslintrc', '.babelrc'],
    aliases: ['JSON', 'json'],
    mimetypes: ['application/json'],
});

// create Monaco editor
const value = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": "unix"
}`;
monaco.editor.create(document.getElementById("container")!, {
    model: monaco.editor.createModel(value, 'json', monaco.Uri.parse('inmemory://model.json'))
});

// create the web socket
const url = createUrl('/sampleServer')
const webSocket = createWebSocket(url);
// listen when the web socket is opened
listen({
    webSocket,
    onConnection: connection => {
        // create and start the language client
        const languageClient = createLanguageClient(connection);
        const disposable = languageClient.start();
        connection.onClose(() => disposable.dispose());
    }
});

const m2p = new MonacoToProtocolConverter();
const p2m = new ProtocolToMonacoConverter();
const services: LanguageClient.IServices = {
    languages: new MonacoLanguages(p2m, m2p),
    workspace: new MonacoWorkspace(m2p)
}

export function createLanguageClient(connection: MessageConnection): LanguageClient {
    return new LanguageClient({
        name: "Sample Language Client",
        clientOptions: {
            documentSelector: ['json'],
            errorHandler: {
                error: () => ErrorAction.Continue,
                closed: () => CloseAction.DoNotRestart
            }
        },
        services,
        connectionProvider: {
            get: (errorHandler, closeHandler) => {
                return Promise.resolve(createConnection(connection, errorHandler, closeHandler))
            }
        }
    })
}

export function createUrl(path: string): string {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${location.host || "127.0.0.1:3000"}${path}`;
}

export function createWebSocket(url: string): WebSocket {
    const socketOptions = {
        maxReconnectionDelay: 10000,
        minReconnectionDelay: 1000,
        reconnectionDelayGrowFactor: 1.3,
        connectionTimeout: 10000,
        maxRetries: Infinity,
        debug: false
    };
    return new ReconnectingWebSocket(url, undefined, socketOptions);
}

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import 'monaco-editor/esm/vs/editor/edcore.main.js';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { buildWorkerDefinition } from 'monaco-editor-workers';

import { initServices, MonacoLanguageClient } from 'monaco-languageclient';
import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import normalizeUrl from 'normalize-url';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient';

buildWorkerDefinition('../../../node_modules/monaco-editor-workers/dist/workers/', new URL('', window.location.href).href, false);

function createLanguageClient(transports: MessageTransports): MonacoLanguageClient {
    return new MonacoLanguageClient({
        name: 'Sample Language Client',
        clientOptions: {
            // use a language id as a document selector
            documentSelector: ['json'],
            // disable the default error handler
            errorHandler: {
                error: () => ({ action: ErrorAction.Continue }),
                closed: () => ({ action: CloseAction.DoNotRestart })
            }
        },
        // create a language client connection from the JSON RPC connection on demand
        connectionProvider: {
            get: () => {
                return Promise.resolve(transports);
            }
        }
    });
}

function createUrl(hostname: string, port: number, path: string): string {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    return normalizeUrl(`${protocol}://${hostname}:${port}${path}`);
}

const start = async () => {
    const createEditor = () => {
        // register Monaco languages
        monaco.languages.register({
            id: 'json',
            extensions: ['.json', '.jsonc'],
            aliases: ['JSON', 'json'],
            mimetypes: ['application/json']
        });

        // create Monaco editor
        const value = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": "unix"
}`;
        monaco.editor.create(document.getElementById('container')!, {
            model: monaco.editor.createModel(value, 'json', monaco.Uri.parse('inmemory://model.json')),
            glyphMargin: true,
            lightbulb: {
                enabled: true
            },
            automaticLayout: true
        });

        // create the web socket
        const url = createUrl('localhost', 3000, '/sampleServer');
        const webSocket = new WebSocket(url);

        webSocket.onopen = () => {
            const socket = toSocket(webSocket);
            const reader = new WebSocketMessageReader(socket);
            const writer = new WebSocketMessageWriter(socket);
            const languageClient = createLanguageClient({
                reader,
                writer
            });
            languageClient.start();
            reader.onClose(() => languageClient.stop());
        };
    };

    await initServices({
        enableThemeService: true
    }).then(() => createEditor());
};

start();

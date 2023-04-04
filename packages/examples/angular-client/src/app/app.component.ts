/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import 'monaco-editor/esm/vs/editor/edcore.main.js';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { buildWorkerDefinition } from 'monaco-editor-workers';

import { MonacoLanguageClient, MonacoServices } from 'monaco-languageclient';
import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import normalizeUrl from 'normalize-url';
import { StandaloneServices } from 'vscode/services';
import getNotificationServiceOverride from 'vscode/service-override/notifications';
import getDialogsServiceOverride from 'vscode/service-override/dialogs';

import { AfterViewInit, Component } from '@angular/core';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient/lib/common/client.js';

StandaloneServices.initialize({
    ...getNotificationServiceOverride(),
    ...getDialogsServiceOverride()
});

buildWorkerDefinition('./assets/monaco-editor-workers/workers', window.location.href + '../..', false);

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class MonacoEditorComponent implements AfterViewInit {
    title = 'angular-client';

    createLanguageClient(transports: MessageTransports): MonacoLanguageClient {
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

    createUrl(hostname: string, port: number, path: string): string {
        const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
        return normalizeUrl(`${protocol}://${hostname}:${port}${path}`);
    }

    ngAfterViewInit(): void {
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

        // install Monaco language client services
        MonacoServices.install();

        // create the web socket
        const url = this.createUrl('localhost', 3000, '/sampleServer');
        const webSocket = new WebSocket(url);

        webSocket.onopen = () => {
            const socket = toSocket(webSocket);
            const reader = new WebSocketMessageReader(socket);
            const writer = new WebSocketMessageWriter(socket);
            const languageClient = this.createLanguageClient({
                reader,
                writer
            });
            languageClient.start();
            reader.onClose(() => languageClient.stop());
        };
    }
}

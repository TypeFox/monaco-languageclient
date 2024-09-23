/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor';
import { initServices } from 'monaco-languageclient/vscode/services';
// monaco-editor does not supply json highlighting with the json worker,
// that's why we use the textmate extension from VSCode
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import '@codingame/monaco-vscode-theme-defaults-default-extension';
import '@codingame/monaco-vscode-json-default-extension';
import { MonacoLanguageClient } from 'monaco-languageclient';
import { WebSocketMessageReader, WebSocketMessageWriter, toSocket } from 'vscode-ws-jsonrpc';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient/browser.js';
import { configureMonacoWorkers } from '../common/client/utils.js';
import { Logger } from 'monaco-languageclient/tools';
import { updateUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override';

export const runClient = async () => {
    await initServices({
        serviceConfig: {
            userServices: {
                ...getConfigurationServiceOverride(),
                ...getThemeServiceOverride(),
                ...getTextmateServiceOverride(),
            },
            debugLogging: true,
        }
    });

    updateUserConfiguration(JSON.stringify({
        'editor.experimental.asyncTokenization': false
    }));

    // register the JSON language with Monaco
    monaco.languages.register({
        id: 'json',
        extensions: ['.json', '.jsonc'],
        aliases: ['JSON', 'json'],
        mimetypes: ['application/json']
    });

    configureMonacoWorkers(new Logger({
        enabled: true,
        debugEnabled: true
    }));

    // create monaco editor
    monaco.editor.create(document.getElementById('monaco-editor-root')!, {
        value: `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": "unix"
}`,
        language: 'json',
        automaticLayout: true,
        wordBasedSuggestions: 'off'
    });
    initWebSocketAndStartClient('ws://localhost:30000/sampleServer');
};

/** parameterized version , support all languageId */
export const initWebSocketAndStartClient = (url: string): WebSocket => {
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
    return webSocket;
};

export const createLanguageClient = (messageTransports: MessageTransports): MonacoLanguageClient => {
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
        messageTransports
    });
};

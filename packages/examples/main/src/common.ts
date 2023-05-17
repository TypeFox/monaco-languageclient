/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import 'monaco-editor/esm/vs/editor/edcore.main.js';
import { languages, Uri } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { createConfiguredEditor, createModelReference } from 'vscode/monaco';
import { initServices, MonacoLanguageClient } from 'monaco-languageclient';
import normalizeUrl from 'normalize-url';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient';
import { WebSocketMessageReader, WebSocketMessageWriter, toSocket } from 'vscode-ws-jsonrpc';

export const createLanguageClient = (transports: MessageTransports): MonacoLanguageClient => {
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
};

export const createUrl = (hostname: string, port: number, path: string): string => {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    return normalizeUrl(`${protocol}://${hostname}:${port}${path}`);
};

export const createWebSocket = (url: string): WebSocket => {
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

export const createDefaultJsonContent = (): string => {
    return `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": "unix"
}`;
};

export const createJsonEditor = async (config: {
    htmlElement: HTMLElement,
    content: string,
    init: boolean
}) => {
    const languageId = 'json';

    if (config.init === true) {
        await initServices({
            enableThemeService: true,
            enableModelEditorService: true,
            modelEditorServiceConfig: {
                useDefaultFunction: true
            },
            debugLogging: true
        });
    }

    // register the JSON language with Monaco
    languages.register({
        id: languageId,
        extensions: ['.json', '.jsonc'],
        aliases: ['JSON', 'json'],
        mimetypes: ['application/json']
    });

    // create the model
    const uri = Uri.parse('/tmp/model.json');
    const modelRef = await createModelReference(uri, config.content);
    modelRef.object.setLanguageId(languageId);

    // create monaco editor
    const editor = createConfiguredEditor(config.htmlElement, {
        model: modelRef.object.textEditorModel,
        glyphMargin: true,
        lightbulb: {
            enabled: true
        },
        automaticLayout: true
    });

    return {
        languageId,
        editor,
        uri,
        modelRef
    };
};

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { editor, languages } from 'monaco-editor';
import { createConfiguredEditor, createModelReference, IReference, ITextFileEditorModel } from 'vscode/monaco';
import '@codingame/monaco-vscode-theme-defaults-default-extension';
import '@codingame/monaco-vscode-json-default-extension';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override';
import { initServices, MonacoLanguageClient } from 'monaco-languageclient';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient';
import { WebSocketMessageReader, WebSocketMessageWriter, toSocket } from 'vscode-ws-jsonrpc';
import { Uri } from 'vscode';

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

export const createUrl = (hostname: string, port: number, path: string, searchParams: Record<string, any> = {}, secure: boolean = location.protocol === 'https:'): string => {
    const protocol = secure ? 'wss' : 'ws';
    const url = new URL(`${protocol}://${hostname}:${port}${path}`);

    for (let [key, value] of Object.entries(searchParams)) {
        if (value instanceof Array) {
            value = value.join(',');
        }
        if (value) {
            url.searchParams.set(key, value);
        }
    }

    return url.toString();
};

export const createWebSocketAndStartClient = (url: string): WebSocket => {
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

export type ExampleJsonEditor = {
    languageId: string;
    editor: editor.IStandaloneCodeEditor;
    uri: Uri;
    modelRef: IReference<ITextFileEditorModel>;
}

export const performInit = async (vscodeApiInit: boolean) => {
    if (vscodeApiInit === true) {
        await initServices({
            userServices: {
                ...getThemeServiceOverride(),
                ...getTextmateServiceOverride(),
                ...getConfigurationServiceOverride(Uri.file('/workspace')),
                ...getKeybindingsServiceOverride()
            },
            debugLogging: true
        });

        // register the JSON language with Monaco
        languages.register({
            id: 'json',
            extensions: ['.json', '.jsonc'],
            aliases: ['JSON', 'json'],
            mimetypes: ['application/json']
        });
    }
};

export const createJsonEditor = async (config: {
    htmlElement: HTMLElement,
    content: string
}) => {
    // create the model
    const uri = Uri.parse('/workspace/model.json');
    const modelRef = await createModelReference(uri, config.content);
    modelRef.object.setLanguageId('json');

    // create monaco editor
    const editor = createConfiguredEditor(config.htmlElement, {
        model: modelRef.object.textEditorModel,
        glyphMargin: true,
        lightbulb: {
            enabled: true
        },
        automaticLayout: true
    });

    const result = {
        editor,
        uri,
        modelRef
    } as ExampleJsonEditor;
    return Promise.resolve(result);
};

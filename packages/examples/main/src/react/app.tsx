/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import 'monaco-editor/esm/vs/editor/edcore.main.js';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { buildWorkerDefinition } from 'monaco-editor-workers';

import { MonacoLanguageClient } from 'monaco-languageclient';
import normalizeUrl from 'normalize-url';
import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import React, { createRef, useEffect, useMemo, useRef } from 'react';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient';

import { initialize as initializeMonacoService } from 'vscode/services';
import { initialize as initializeVscodeExtensions } from 'vscode/extensions';
import getModelEditorServiceOverride from 'vscode/service-override/modelEditor';
import getNotificationServiceOverride from 'vscode/service-override/notifications';
import getTextmateServiceOverride from 'vscode/service-override/textmate';
import getThemeServiceOverride from 'vscode/service-override/theme';

buildWorkerDefinition('../../../node_modules/monaco-editor-workers/dist/workers/', new URL('', window.location.href).href, false);

export function createUrl(hostname: string, port: string, path: string): string {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    return normalizeUrl(`${protocol}://${hostname}:${port}${path}`);
}

function createWebSocket(url: string) {
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
}

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

let init = false;

export type EditorProps = {
    defaultCode: string;
    hostname?: string;
    port?: string;
    path?: string;
    className?: string;
}

export const ReactMonacoEditor: React.FC<EditorProps> = ({
    defaultCode,
    hostname = 'localhost',
    path = '/sampleServer',
    port = '3000',
    className
}) => {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
    const ref = createRef<HTMLDivElement>();
    const url = useMemo(() => createUrl(hostname, port, path), [hostname, port, path]);
    let lspWebSocket: WebSocket;

    useEffect(() => {
        if (ref.current != null) {
            const firstRun = async () => {
                await initializeMonacoService({
                    ...getModelEditorServiceOverride(async (model, options, sideBySide) => {
                        console.log('Trying to open a model: ', model, options, sideBySide);
                        return undefined;
                    }),
                    ...getNotificationServiceOverride(),
                    ...getTextmateServiceOverride(),
                    ...getThemeServiceOverride()
                })
                    .then(() => console.log('initializeMonacoService completed successfully'))
                    .catch((e) => console.error(`initializeMonacoService had errors: ${e}`));

                await initializeVscodeExtensions()
                    .then(() => console.log('initializeVscodeExtensions completed successfully'))
                    .catch((e) => console.error(`initializeVscodeExtensions had errors: ${e}`));
                init = true;
            };
            if (!init) {
                firstRun();
            }

            // register Monaco languages
            monaco.languages.register({
                id: 'json',
                extensions: ['.json', '.jsonc'],
                aliases: ['JSON', 'json'],
                mimetypes: ['application/json']
            });

            // create Monaco editor
            editorRef.current = monaco.editor.create(ref.current!, {
                model: monaco.editor.createModel(defaultCode, 'json', monaco.Uri.parse('inmemory://model.json')),
                glyphMargin: true,
                lightbulb: {
                    enabled: true
                },
                automaticLayout: true
            });

            lspWebSocket = createWebSocket(url);

            return () => {
                editorRef.current!.dispose();
            };
        }

        window.onbeforeunload = () => {
            // On page reload/exit, close web socket connection
            lspWebSocket?.close();
        };
        return () => {
            // On component unmount, close web socket connection
            lspWebSocket?.close();
        };
    }, []);

    return (
        <div
            ref={ref}
            style={{ height: '50vh' }}
            className={className}
        />
    );
};

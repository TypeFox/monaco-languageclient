/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import 'monaco-editor/esm/vs/editor/editor.all.js';

// support all editor features
import 'monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickInput/standaloneQuickInputService.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast.js';

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { buildWorkerDefinition } from 'monaco-editor-workers';

import { CloseAction, ErrorAction, MessageTransports, MonacoLanguageClient, MonacoServices } from 'monaco-languageclient';

import React from 'react';
import normalizeUrl from 'normalize-url';
import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import { StandaloneServices } from 'vscode/services';
import getMessageServiceOverride from 'vscode/service-override/messages';

StandaloneServices.initialize({
    ...getMessageServiceOverride(document.body)
});
buildWorkerDefinition('dist', new URL('', window.location.href).href, false);

export interface EditorProps {
    text: string;
    hostname?: string;
    port?: string;
    path?: string;
    className?: string
}

export class ReactMonacoEditor extends React.Component<EditorProps> {
    private containerElement?: HTMLDivElement;
    private editor: monaco.editor.IStandaloneCodeEditor;

    private resizeEvent: () => void;

    constructor(props: EditorProps) {
        super(props);
        this.containerElement = undefined;
    }

    componentDidMount() {
        const { text, className } = this.props;
        if (this.containerElement) {
            this.containerElement.className = className ?? '';

            // register Monaco languages
            monaco.languages.register({
                id: 'json',
                extensions: ['.json', '.jsonc'],
                aliases: ['JSON', 'json'],
                mimetypes: ['application/json']
            });

            // create Monaco editor
            this.editor = monaco.editor.create(this.containerElement, {
                model: monaco.editor.createModel(text, 'json', monaco.Uri.parse('inmemory://model.json')),
                glyphMargin: true,
                lightbulb: {
                    enabled: true
                }
            });

            // install Monaco language client services
            MonacoServices.install();

            this.createWebSocket();

            this.resizeEvent = () => this.editor?.layout();
            window.addEventListener('resize', this.resizeEvent);
        }
    }

    componentDidUpdate(_prevProps: EditorProps) {
        const { text } = this.props;
        const model = this.editor.getModel();
        if (model && text !== model.getValue() && text) {
            model.setValue(text);
        }
    }

    componentWillUnmount() {
    }

    assignRef = (component: HTMLDivElement) => {
        this.containerElement = component;
    };

    private createWebSocket() {
        // create the web socket
        const url = this.createUrl();
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

    private createLanguageClient(transports: MessageTransports): MonacoLanguageClient {
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

    private createUrl(): string {
        const { hostname, port, path } = this.props;
        const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
        return normalizeUrl(`${protocol}://${hostname ?? 'localhost'}:${Number(port ?? +'3000')}${path ?? '/sampleServer'}`);
    }

    render() {
        return (
            <div
                ref= { this.assignRef }
                style = {
                    { height: '50vh' }
                }
                className = { this.props.className }
            />
        );
    }
}

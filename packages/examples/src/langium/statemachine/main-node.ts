/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { EditorApp } from 'monaco-languageclient/editorApp';
import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { SocketIoMessageReader, SocketIoMessageWriter } from 'vscode-socketio-jsonrpc';
import { SocketIoClient } from 'vscode-socketio-jsonrpc/browser';
import text from '../../../resources/langium/statemachine/example.statemachine?raw';
import { createLangiumGlobalConfig } from './config/statemachineConfig.js';

export const runStatemachine = async () => {
    const socketIoClient = new SocketIoClient({
        url: 'ws://localhost:30003'
    });
    const socket = socketIoClient.start();
    const reader = new SocketIoMessageReader(socket);
    const writer = new SocketIoMessageWriter(socket);
    reader.listen((message) => {
        console.log('Received message from worker:', message);
    });

    const htmlContainer = document.getElementById('monaco-editor-root')!;
    // the configuration does not contain any text content
    const appConfig = createLangiumGlobalConfig({
        languageServerId: 'first',
        codeContent: {
            text,
            uri: '/workspace/example.statemachine'
        },
        connection: {
            options: {
                $type: 'SocketIoDirect',
                webSocket: socket
            },
            messageTransports: {
                reader, writer
            }
        },
        htmlContainer
    });
    const editorApp = new EditorApp(appConfig.editorAppConfig);

    // perform global monaco-vscode-api init
    const apiWrapper = new MonacoVscodeApiWrapper(appConfig.vscodeApiConfig);
    await apiWrapper.start();

    // init language client
    const lcWrapper = new LanguageClientWrapper(appConfig.languageClientConfig);
    await lcWrapper.start();

    // run editorApp
    await editorApp.start(htmlContainer);
};

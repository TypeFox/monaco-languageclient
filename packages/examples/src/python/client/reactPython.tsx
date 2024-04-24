/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { RegisteredFileSystemProvider, registerFileSystemOverlay, RegisteredMemoryFile } from '@codingame/monaco-vscode-files-service-override';
import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { createUserConfig } from './config.js';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { getTextContent } from '../../common/example-apps-common.js';

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        basePath: '../../../node_modules'
    });
};

export const runPythonReact = async () => {
    const badPyCode = await getTextContent(new URL('./src/python/client/bad.py', window.location.href));
    const badPyUri = vscode.Uri.file('/workspace/bad.py');
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(badPyUri, badPyCode));
    registerFileSystemOverlay(1, fileSystemProvider);

    const onTextChanged = (text: string, isDirty: boolean) => {
        console.log(`Dirty? ${isDirty} Content: ${text}`);
    };

    const htmlElement = document.getElementById('root');
    const comp = <MonacoEditorReactComp
        userConfig={createUserConfig('/workspace', badPyCode, '/workspace/bad.py')}
        style={{
            'paddingTop': '5px',
            'height': '80vh'
        }}
        onTextChanged={onTextChanged}
        onLoad={(wrapper: MonacoEditorLanguageClientWrapper) => {
            console.log(`Loaded ${wrapper.reportStatus().join('\n').toString()}`);
        }}
        onError={(e) => {
            console.error(e);
        }}
    />;
    ReactDOM.createRoot(htmlElement!).render(<StrictMode>{comp}</StrictMode>);
};

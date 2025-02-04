/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { RegisteredFileSystemProvider, registerFileSystemOverlay, RegisteredMemoryFile } from '@codingame/monaco-vscode-files-service-override';
import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { MonacoEditorLanguageClientWrapper, type TextChanges } from 'monaco-editor-wrapper';
import { createWrapperConfig } from './config.js';
import badPyCode from '../../../resources/python/bad.py?raw';
import { disableElement } from '../../common/client/utils.js';

export const runPythonReact = async () => {
    const badPyUri = vscode.Uri.file('/workspace/bad.py');
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(badPyUri, badPyCode));
    registerFileSystemOverlay(1, fileSystemProvider);

    const onTextChanged = (textChanges: TextChanges) => {
        console.log(`Dirty? ${textChanges.isDirty}\ntext: ${textChanges.modified}\ntextOriginal: ${textChanges.original}`);
    };
    const wrapperConfig = createWrapperConfig('/workspace', badPyCode, '/workspace/bad.py');
    const root = ReactDOM.createRoot(document.getElementById('react-root')!);

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            const App = () => {
                return (
                    <div style={{ 'height': '80vh', padding: '5px' }} >
                        <MonacoEditorReactComp
                            wrapperConfig={wrapperConfig}
                            style={{ 'height': '100%' }}
                            onTextChanged={onTextChanged}
                            onLoad={(wrapper: MonacoEditorLanguageClientWrapper) => {
                                console.log(`Loaded ${wrapper.reportStatus().join('\n').toString()}`);
                            }}
                            onError={(e) => {
                                console.error(e);
                            }} />
                    </div>
                );
            };

            const strictMode = (document.getElementById('checkbox-strictmode')! as HTMLInputElement).checked;

            if (strictMode) {
                root.render(<StrictMode><App /></StrictMode>);
            } else {
                root.render(<App />);
            }
            disableElement('checkbox-strictmode', true);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', () => {
            root.render([]);
        });
    } catch (e) {
        console.error(e);
    }
};

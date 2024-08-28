/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { RegisteredFileSystemProvider, registerFileSystemOverlay, RegisteredMemoryFile } from '@codingame/monaco-vscode-files-service-override';
import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import type { TextChanges } from '@typefox/monaco-editor-react';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { createUserConfig } from './config.js';
import badPyCode from './bad.py?raw';

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        ignoreMapping: true,
        workerLoaders: {
            editorWorkerService: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
        }
    });
};

export const runPythonReact = async () => {
    const badPyUri = vscode.Uri.file('/workspace/bad.py');
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(badPyUri, badPyCode));
    registerFileSystemOverlay(1, fileSystemProvider);

    const onTextChanged = (textChanges: TextChanges) => {
        console.log(`Dirty? ${textChanges.isDirty}\ntext: ${textChanges.text}\ntextOriginal: ${textChanges.textOriginal}`);
    };
    const htmlElement = document.getElementById('monaco-editor-root');
    const root = ReactDOM.createRoot(htmlElement!);

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            const App = () => {
                return (
                    <div style={{ 'height': '80vh', padding: '5px' }} >
                        <MonacoEditorReactComp
                            userConfig={createUserConfig('/workspace', badPyCode, '/workspace/bad.py')}
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
        });
        document.querySelector('#button-dispose')?.addEventListener('click', () => {
            root.render([]);
        });
    } catch (e) {
        console.error(e);
    }
};

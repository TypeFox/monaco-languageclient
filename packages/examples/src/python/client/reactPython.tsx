/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { type RegisterLocalProcessExtensionResult } from '@codingame/monaco-vscode-api/extensions';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { MonacoEditorLanguageClientWrapper, type TextChanges } from 'monaco-editor-wrapper';
import { createWrapperConfig  } from './config.js';
import { confiugureDebugging } from '../../debugger/client/debugger.js';

export const runPythonReact = async () => {
    const appConfig = createWrapperConfig();
    
    const onTextChanged = (textChanges: TextContents) => {
        console.log(`text: ${textChanges.modified}\ntextOriginal: ${textChanges.original}`);
    };

    const root = ReactDOM.createRoot(document.getElementById('react-root')!);

    const App = () => {
        return (
            <div style={{ 'backgroundColor': '#1f1f1f' }} >
                <MonacoEditorReactComp
                    wrapperConfig={appConfig.wrapperConfig}
                    style={{ 'height': '100%' }}
                    onTextChanged={onTextChanged}
                    onLoad={async (wrapper: MonacoEditorLanguageClientWrapper) => {
                        const result = wrapper.getExtensionRegisterResult('mlc-python-example') as RegisterLocalProcessExtensionResult;
                        result.setAsDefaultApi();

                        const initResult = wrapper.getExtensionRegisterResult('debugger-py-client') as RegisterLocalProcessExtensionResult | undefined;
                        if (initResult !== undefined) {
                            confiugureDebugging(await initResult.getApi(), appConfig.configParams);
                        }

                        await vscode.commands.executeCommand('workbench.view.explorer');
                        await vscode.window.showTextDocument(appConfig.configParams.files.get('hello2.py')!.uri);
                    }}
                    onError={(e) => {
                        console.error(e);
                    }} />
            </div>
        );
    };
    root.render(<App />);
};

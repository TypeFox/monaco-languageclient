/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

import { type RegisterLocalProcessExtensionResult } from '@codingame/monaco-vscode-api/extensions';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import type { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as vscode from 'vscode';
import { configureDebugging } from '../../debugger/client/debugger.js';
import { createPythonAppConfig } from './config.js';

export const runPythonReact = async () => {
    const appConfig = createPythonAppConfig();

    const onVscodeApiInitDone = async (apiWrapper: MonacoVscodeApiWrapper) => {
        const result = apiWrapper.getExtensionRegisterResult('mlc-python-example') as RegisterLocalProcessExtensionResult;
        result.setAsDefaultApi();

        const initResult = apiWrapper.getExtensionRegisterResult('debugger-py-client') as RegisterLocalProcessExtensionResult | undefined;
        if (initResult !== undefined) {
            configureDebugging(await initResult.getApi(), appConfig.configParams);
        }

        await vscode.commands.executeCommand('workbench.view.explorer');
        await vscode.window.showTextDocument(appConfig.configParams.files.get('hello2.py')!.uri);
    };

    const root = ReactDOM.createRoot(document.getElementById('react-root')!);

    const languageClientConfigs = {
        configs: {
            langium: appConfig.languageClientConfig
        }
    };
    const App = () => {
        return (
            <div style={{ 'backgroundColor': '#1f1f1f' }} >
                <MonacoEditorReactComp
                    vscodeApiConfig={appConfig.vscodeApiConfig}
                    editorAppConfig={appConfig.editorAppConfig}
                    languageClientConfigs={languageClientConfigs}
                    style={{ 'height': '100%' }}
                    onVscodeApiInitDone={onVscodeApiInitDone}
                    onError={(e) => {
                        console.error(e);
                    }} />
            </div>
        );
    };
    root.render(<App />);
};

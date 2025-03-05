/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { type RegisterLocalProcessExtensionResult } from '@codingame/monaco-vscode-api/extensions';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { createWrapperConfig } from './config.js';
import { configureDebugging } from '../../debugger/client/debugger.js';

export const runPythonWrapper = async () => {
    const appConfig = createWrapperConfig();
    const wrapper = new MonacoEditorLanguageClientWrapper();

    if (wrapper.isStarted()) {
        console.warn('Editor was already started!');
    } else {
        await wrapper.init(appConfig.wrapperConfig);

        const result = wrapper.getExtensionRegisterResult('mlc-python-example') as RegisterLocalProcessExtensionResult;
        result.setAsDefaultApi();

        const initResult = wrapper.getExtensionRegisterResult('debugger-py-client') as RegisterLocalProcessExtensionResult | undefined;
        if (initResult !== undefined) {
            configureDebugging(await initResult.getApi(), appConfig.configParams);
        }

        await vscode.commands.executeCommand('workbench.view.explorer');
        await vscode.window.showTextDocument(appConfig.configParams.files.get('hello2.py')!.uri);

        await wrapper.start();
    }
};

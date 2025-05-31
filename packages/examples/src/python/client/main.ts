/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { type RegisterLocalProcessExtensionResult } from '@codingame/monaco-vscode-api/extensions';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import * as vscode from 'vscode';
import { configureDebugging } from '../../debugger/client/debugger.js';
import { createPythonAppConfig } from './config.js';

export const runPythonWrapper = async () => {
    const appConfig = createPythonAppConfig();

    // perform global init
    const apiWrapper = new MonacoVscodeApiWrapper(appConfig.vscodeApiConfig);
    await apiWrapper.init();

    const lcWrapper = new LanguageClientWrapper(appConfig.languageClientConfig);

    const wrapper = new MonacoEditorLanguageClientWrapper();

    if (wrapper.isStarted()) {
        console.warn('Editor was already started!');
    } else {
        await wrapper.init(appConfig.wrapperConfig);

        const result = apiWrapper.getExtensionRegisterResult('mlc-python-example') as RegisterLocalProcessExtensionResult;
        result.setAsDefaultApi();

        const initResult = apiWrapper.getExtensionRegisterResult('debugger-py-client') as RegisterLocalProcessExtensionResult | undefined;
        if (initResult !== undefined) {
            configureDebugging(await initResult.getApi(), appConfig.configParams);
        }

        await lcWrapper.start();

        await vscode.commands.executeCommand('workbench.view.explorer');
        await vscode.window.showTextDocument(appConfig.configParams.files.get('hello2.py')!.uri);

        await wrapper.start(appConfig.vscodeApiConfig.htmlContainer!);
    }
};

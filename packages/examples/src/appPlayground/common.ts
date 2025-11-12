/* --------------------------------------------------------------------------------------------
* Copyright (c) 2024 TypeFox and others.
* Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import type { RegisterLocalProcessExtensionResult } from '@codingame/monaco-vscode-api/extensions';
import type { ConfigResult } from './config.js';
import type { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';

export const configurePostStart = async (apiWrapper: MonacoVscodeApiWrapper, configResult: ConfigResult) => {
    const result = apiWrapper.getExtensionRegisterResult('mlc-app-playground') as RegisterLocalProcessExtensionResult;
    result.setAsDefaultApi();

    await Promise.all([
        await vscode.workspace.openTextDocument(configResult.helloTsUri),
        await vscode.workspace.openTextDocument(configResult.testerTsUri),
        await vscode.workspace.openTextDocument(configResult.helloJsonUri)
    ]);

    await Promise.all([
        await vscode.window.showTextDocument(configResult.helloTsUri)
    ]);

    console.log('Application Playground started');
};

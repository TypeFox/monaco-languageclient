/* --------------------------------------------------------------------------------------------
* Copyright (c) 2024 TypeFox and others.
* Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { RegisterLocalProcessExtensionResult } from 'vscode/extensions';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { ConfigResult } from './config.js';

export const configurePostStart = async (wrapper: MonacoEditorLanguageClientWrapper, configResult: ConfigResult) => {
    const result = wrapper.getExtensionRegisterResult('mlc-app-playground') as RegisterLocalProcessExtensionResult;
    result.setAsDefaultApi();

    // WA: Force show explorer and not search
    // await vscode.commands.executeCommand('workbench.view.explorer');

    await Promise.all([
        await vscode.workspace.openTextDocument(configResult.helloTsUri),
        await vscode.workspace.openTextDocument(configResult.testerTsUri)
    ]);

    await Promise.all([
        await vscode.window.showTextDocument(configResult.helloTsUri)
    ]);

    console.log('Application Playground started');
};

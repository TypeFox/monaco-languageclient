/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { RegisteredFileSystemProvider, registerFileSystemOverlay, RegisteredMemoryFile } from '@codingame/monaco-vscode-files-service-override';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { createUserConfig } from './config.js';
import helloCppCode from './hello.cpp?raw';
import testerHCode from './tester.h?raw';

export const runClangdWrapper = () => {
    const wrapper = new MonacoEditorLanguageClientWrapper();
    const htmlElement = document.getElementById('monaco-editor-root');

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            const userConfig = await createUserConfig(helloCppCode);
            await wrapper.initAndStart(userConfig, htmlElement);

            const helloCppUri = vscode.Uri.file('/home/web_user/hello.cpp');
            const testerHUri = vscode.Uri.file('/home/web_user/tester.h');

            const fileSystemProvider = new RegisteredFileSystemProvider(false);
            fileSystemProvider.registerFile(new RegisteredMemoryFile(helloCppUri, helloCppCode));
            fileSystemProvider.registerFile(new RegisteredMemoryFile(testerHUri, testerHCode));

            registerFileSystemOverlay(1, fileSystemProvider);

            await vscode.workspace.openTextDocument(helloCppUri);
            await vscode.workspace.openTextDocument(testerHUri);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await wrapper.dispose();
        });
    } catch (e) {
        console.error(e);
    }
};

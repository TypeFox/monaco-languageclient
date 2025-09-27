/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';
import * as vscode from 'vscode';
// this is required syntax highlighting
import '@codingame/monaco-vscode-cpp-default-extension';
import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { createDefaultWorkspaceContent, disableElement } from '../../common/client/utils.js';
import { HOME_DIR, WORKSPACE_PATH } from '../definitions.js';
import { createClangdAppConfig } from './config.js';
import { MainRemoteMessageChannelFs } from './mainRemoteMessageChannelFs.js';
import { ClangdWorkerHandler } from './workerHandler.js';

export const runClangdWrapper = async () => {
    const channelLs = new MessageChannel();
    const channelFs = new MessageChannel();

    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    const workspaceFileUri = vscode.Uri.file(`${HOME_DIR}/workspace.code-workspace`);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(workspaceFileUri, createDefaultWorkspaceContent(WORKSPACE_PATH)));
    registerFileSystemOverlay(1, fileSystemProvider);

    const readiness = async () => {
        const resourceUri = vscode.Uri.file(`${WORKSPACE_PATH}/main.cpp`);
        await vscode.window.showTextDocument(resourceUri);
    };
    new MainRemoteMessageChannelFs(fileSystemProvider, channelFs.port1, readiness);

    const clangdWorkerHandler = new ClangdWorkerHandler();
    const appConfig = await createClangdAppConfig({
        htmlContainer: document.body,
        workspaceUri: vscode.Uri.file(WORKSPACE_PATH),
        workspaceFileUri,
        clangdWorkerHandler,
        lsMessageLocalPort: channelLs.port1
    });

    // perform global init
    const apiWrapper = new MonacoVscodeApiWrapper(appConfig.vscodeApiConfig);
    await apiWrapper.start();

    const lcWrapper = new LanguageClientWrapper(appConfig.languageClientConfig);

    /* @vite-ignore */
    const compressedWorkspaceUrl = new URL('../../../resources/clangd/workspace.zip', import.meta.url).href;
    const initConfig = {
        lsMessagePort: channelLs.port2,
        fsMessagePort: channelFs.port2,
        clearIndexedDb: false,
        // set to true to use the compressed workspace at the specified URL
        useCompressedWorkspace: false,
        compressedWorkspaceUrl
    };

    const startWrapper = async () => {
        await clangdWorkerHandler.init(initConfig);
        await clangdWorkerHandler.launch();
        await lcWrapper.start();
    };

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            disableElement('button-start', true);
            disableElement('button-start-fresh', true);
            await startWrapper();
        });
        document.querySelector('#button-start-fresh')?.addEventListener('click', async () => {
            initConfig.clearIndexedDb = true;
            disableElement('button-start', true);
            disableElement('button-start-fresh', true);
            await startWrapper();
        });
    } catch (e) {
        console.error(e);
    }
};

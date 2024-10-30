/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { RegisteredFileSystemProvider, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';
// this is required syntax highlighting
import '@codingame/monaco-vscode-cpp-default-extension';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { createWrapperConfig } from './config.js';
import { ClangdWorkerHandler } from './workerHandler.js';
import { MainRemoteMessageChannelFs } from './mainRemoteMessageChannelFs.js';
// import { getMonacoEnvironmentEnhanced, MonacoEnvironmentEnhanced } from 'monaco-languageclient/vscode/services';
import { defaultViewsHtml } from 'monaco-editor-wrapper/vscode/services';
import { createDefaultWorkspaceFile } from '../../common/client/utils.js';
import { WORKSPACE_PATH } from '../definitions.js';

const wrapper = new MonacoEditorLanguageClientWrapper();

export const runClangdWrapper = async () => {
    const channelLs = new MessageChannel();
    const channelFs = new MessageChannel();

    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    const workspaceFileUri = vscode.Uri.file(`${WORKSPACE_PATH}/.vscode/workspace.code-workspace`);
    fileSystemProvider.registerFile(createDefaultWorkspaceFile(workspaceFileUri, WORKSPACE_PATH));
    registerFileSystemOverlay(1, fileSystemProvider);

    const readiness = async () => {
        const resourceUri = vscode.Uri.file(`${WORKSPACE_PATH}/hello.cpp`);
        await vscode.window.showTextDocument(resourceUri);
    };
    new MainRemoteMessageChannelFs(fileSystemProvider, channelFs.port1, readiness);

    const htmlContainer = document.createElement('div', { is: 'app' });
    htmlContainer.innerHTML = defaultViewsHtml;
    document.body.append(htmlContainer);

    const clangdWorkerHandler = new ClangdWorkerHandler();
    const userConfig = await createWrapperConfig({
        htmlContainer: document.body,
        workspaceUri: vscode.Uri.file(WORKSPACE_PATH),
        workspaceFileUri,
        clangdWorkerHandler,
        lsMessageLocalPort: channelLs.port1
    });

    await wrapper.init(userConfig);
    // const mee = getMonacoEnvironmentEnhanced() as MEEOPen;
    // mee.openFile = openFile;

    await clangdWorkerHandler.init({
        lsMessagePort: channelLs.port2,
        fsMessagePort: channelFs.port2
    });
    await clangdWorkerHandler.launch();

    await wrapper.startLanguageClients();
};

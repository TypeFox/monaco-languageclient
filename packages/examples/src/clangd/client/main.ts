/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { ITextFileEditorModel } from 'vscode/monaco';
import { RegisteredFileSystemProvider, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';
import { IReference, OpenEditor } from '@codingame/monaco-vscode-editor-service-override';
// this is required syntax highlighting
import '@codingame/monaco-vscode-cpp-default-extension';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { createUserConfig } from './config.js';
import { ClangdWorkerHandler } from './workerHandler.js';
import { MainRemoteMessageChannelFs } from './mainRemoteMessageChannelFs.js';
import { getMonacoEnvironmentEnhanced, MonacoEnvironmentEnhanced } from 'monaco-languageclient/vscode/services';

const wrapper = new MonacoEditorLanguageClientWrapper();
const htmlContainer = document.getElementById('monaco-editor-root')!;
const openFiles = new Map<string, vscode.Uri>();

export interface MEEOPen extends MonacoEnvironmentEnhanced {
    openFile(resourceUri: vscode.Uri): void;
}

export const runClangdWrapper = async () => {
    document.querySelector('#button-start')?.addEventListener('click', async () => {
        const channelLs = new MessageChannel();
        const channelFs = new MessageChannel();

        const fileSystemProvider = new RegisteredFileSystemProvider(false);
        registerFileSystemOverlay(1, fileSystemProvider);

        const readiness = async () => {
            const resourceUri = vscode.Uri.file('/home/web_user/hello.cpp');
            // const resourceUri = vscode.Uri.file('/usr/include/wasm32-wasi/sys/eventfd.h');
            // await vscode.workspace.openTextDocument('/usr/include/wasm32-wasi/stdint.h');

            openFile(resourceUri);
            const textDocument = await vscode.workspace.openTextDocument(resourceUri);

            wrapper.updateCodeResources({
                main: {
                    uri: resourceUri.toString(),
                    text: textDocument.getText()
                }
            });
        };
        new MainRemoteMessageChannelFs(fileSystemProvider, channelFs.port1, readiness);

        const clangdWorkerHandler = new ClangdWorkerHandler();
        const userConfig = await createUserConfig({
            htmlContainer,
            clangdWorkerHandler,
            lsMessageLocalPort: channelLs.port1
        });
        await wrapper.init(userConfig);
        const mee = getMonacoEnvironmentEnhanced() as MEEOPen;
        mee.openFile = openFile;

        await clangdWorkerHandler.init({
            lsMessagePort: channelLs.port2,
            fsMessagePort: channelFs.port2
        });
        await clangdWorkerHandler.launch();

        await wrapper.start();
    });
};

const openFile = async (resourceUri: vscode.Uri) => {
    addFile(resourceUri);
    // const filename = retrieveFilename(resourceUri);
    const textDocument = await vscode.workspace.openTextDocument(resourceUri);
    wrapper.updateCodeResources({
        main: {
            uri: resourceUri.toString(),
            text: textDocument.getText()
        }
    });
};

const retrieveFilename = (resourceUri: vscode.Uri) => {
    return resourceUri.toString().substring(resourceUri.toString().lastIndexOf('/') + 1);
};

const addFile = (resourceUri: vscode.Uri) => {
    const filename = retrieveFilename(resourceUri);
    openFiles.set(filename, resourceUri);
    const openFilesSelect = document.getElementById('openFiles') as HTMLSelectElement;
    openFilesSelect.onchange = (e: Event) => {
        const newFilename = (e.target as HTMLInputElement).value;
        const newResourceUri = openFiles.get(newFilename);
        console.log(`Selected file: ${newFilename} uri ${newResourceUri}`);
        (window.MonacoEnvironment as MEEOPen).openFile(newResourceUri!);
    };

    let addValue = true;
    for (const option of openFilesSelect.options) {
        if (option.value === filename) {
            addValue = false;
            break;
        }
    }

    if (addValue) {
        const newOption = new Option(filename, filename);
        openFilesSelect.add(newOption);
    }
    openFilesSelect.value = filename;
};

export const openNewEditor: OpenEditor = async (modelRef) => {
    addFile(modelRef.object.textEditorModel.uri);
    wrapper.updateEditorModels({
        modelRef: modelRef as IReference<ITextFileEditorModel>
    });

    return wrapper.getEditor();
};

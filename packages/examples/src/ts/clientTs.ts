/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import { InMemoryFileSystemProvider, registerFileSystemOverlay, type IFileWriteOptions } from '@codingame/monaco-vscode-files-service-override';
import '@codingame/monaco-vscode-javascript-default-extension';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import '@codingame/monaco-vscode-typescript-basics-default-extension';
import '@codingame/monaco-vscode-typescript-language-features-default-extension';
import { EditorApp, type EditorAppConfig } from 'monaco-languageclient/editorApp';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import * as vscode from 'vscode';
import { createDefaultWorkspaceContent, disableElement } from '../common/client/utils.js';

export const runTsWrapper = async () => {
    disableElement('button-diff', true);

    const code = `const takesString = (x: string) => {};

// you should see an error marker in the next line
takesString(0);`;

    const codeOriginal = `const takesNumber = (x: number) => {};

// you should see an error marker in the next line
takesNumber(0);`;

    const textEncoder = new TextEncoder();
    const options: IFileWriteOptions = {
        atomic: false,
        unlock: false,
        create: true,
        overwrite: true
    };
    const workspaceUri = vscode.Uri.file('/workspace');
    const workspaceFileUri = vscode.Uri.file('/workspace.code-workspace');
    const codeUri = vscode.Uri.file('/workspace/hello.ts');
    const codeOriginalUri = vscode.Uri.file('/workspace/goodbye.ts');
    const fileSystemProvider = new InMemoryFileSystemProvider();
    await fileSystemProvider.mkdir(workspaceUri);
    await fileSystemProvider.writeFile(codeUri, textEncoder.encode(code), options);
    await fileSystemProvider.writeFile(codeOriginalUri, textEncoder.encode(codeOriginal), options);
    await fileSystemProvider.writeFile(workspaceFileUri, textEncoder.encode(createDefaultWorkspaceContent('/workspace')), options);
    registerFileSystemOverlay(1, fileSystemProvider);

    let currentOriginalCode = codeOriginal;
    let currentOriginalCodeUri = codeOriginalUri;
    let currentCode = code;
    let currentCodeUri = codeUri;
    let swapCode = false;
    let diffEditor = false;

    const htmlContainer = document.getElementById('monaco-editor-root')!;
    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        viewsConfig: {
            $type: 'EditorService',
            htmlContainer
        },
        logLevel: LogLevel.Debug,
        serviceOverrides: {
            ...getKeybindingsServiceOverride()
        },
        advanced: {
            enableExtHostWorker: true,
        },
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern',
                'editor.wordBasedSuggestions': 'off',
                'typescript.tsserver.web.projectWideIntellisense.enabled': true,
                'typescript.tsserver.web.projectWideIntellisense.suppressSemanticErrors': false,
                'diffEditor.renderSideBySide': false,
                'editor.guides.bracketPairsHorizontal': true,
                'editor.experimental.asyncTokenization': true
            })
        },
        workspaceConfig: {
            enableWorkspaceTrust: true,
            workspaceProvider: {
                trusted: true,
                async open() {
                    window.open(window.location.href);
                    return true;
                },
                workspace: {
                    workspaceUri: workspaceFileUri
                }
            }
        },
        monacoWorkerFactory: configureDefaultWorkerFactory
    };

    // perform global monaco-vscode-api init
    const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await apiWrapper.start();

    let editorApp: EditorApp | undefined = undefined;

    const createEditorAppConfig = (useDiffEditor: boolean): EditorAppConfig => {
        return {
            codeResources: {
                modified: {
                    text: currentCode,
                    uri: currentCodeUri.path
                },
                original: {
                    text: currentOriginalCode,
                    uri: currentOriginalCodeUri.path,
                }
            },
            useDiffEditor: useDiffEditor
        };
    };

    const swapCurrentCode = () => {
        swapCode = !swapCode;
        if (swapCode) {
            currentCode = codeOriginal;
            currentCodeUri = codeOriginalUri;
            currentOriginalCode = code;
            currentOriginalCodeUri = codeUri;
        } else {
            currentCode = code;
            currentCodeUri = codeUri;
            currentOriginalCode = codeOriginal;
            currentOriginalCodeUri = codeOriginalUri;
        }
    };

    const updateEditorCodeResources = async (editorApp: EditorApp) => {
        await editorApp.updateCodeResources({
            modified: {
                text: currentCode,
                uri: currentCodeUri.path
            },
            original: {
                text: currentOriginalCode,
                uri: currentOriginalCodeUri.path
            }
        });
    };

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            disableElement('button-start', true);
            disableElement('button-diff', false);
            editorApp = new EditorApp(createEditorAppConfig(diffEditor));
            await editorApp.start(htmlContainer);

            await vscode.workspace.openTextDocument(codeUri);
            await vscode.workspace.openTextDocument(codeOriginalUri);

            vscode.commands.getCommands().then((x) => {
                console.log(`Found ${x.length} commands`);
                const finding = x.find((elem) => elem === 'actions.find');
                console.log(`Found command: ${finding}`);
            });

            editorApp.getEditor()?.focus();
            await vscode.commands.executeCommand('actions.find');

            await updateEditorCodeResources(editorApp);
        });
        document.querySelector('#button-swap-code')?.addEventListener('click', async () => {
            swapCurrentCode();

            if (editorApp !== undefined) {
                await updateEditorCodeResources(editorApp);
            }
        });
        document.querySelector('#button-diff')?.addEventListener('click', async () => {
            diffEditor = !diffEditor;
            const editorAppConfig = createEditorAppConfig(diffEditor);

            if (editorApp !== undefined) {
                await editorApp.dispose();
            }
            editorApp = new EditorApp(editorAppConfig);
            await editorApp.start(htmlContainer);
            await updateEditorCodeResources(editorApp);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            disableElement('button-start', false);
            disableElement('button-diff', true);

            await editorApp?.dispose();
        });
    } catch (e) {
        console.error(e);
    }
};


/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import '@codingame/monaco-vscode-javascript-default-extension';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import '@codingame/monaco-vscode-typescript-basics-default-extension';
import '@codingame/monaco-vscode-typescript-language-features-default-extension';
import { EditorApp, type EditorAppConfig } from 'monaco-languageclient/editorApp';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import * as vscode from 'vscode';
import { disableElement } from '../common/client/utils.js';

export const runTsWrapper = async () => {
    const codeUri = '/workspace/hello.ts';
    const code = `function sayHello(): string {
    return "Hello";
};`;

    const codeOriginalUri = '/workspace/goodbye.ts';
    const codeOriginal = `function sayGoodbye(): string {
    return "Goodbye";
};`;

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
                'typescript.tsserver.web.projectWideIntellisense.enabled': true,
                'typescript.tsserver.web.projectWideIntellisense.suppressSemanticErrors': false,
                'diffEditor.renderSideBySide': false,
                'editor.lightbulb.enabled': 'on',
                'editor.glyphMargin': true,
                'editor.guides.bracketPairsHorizontal': true,
                'editor.experimental.asyncTokenization': true
            })
        },
        monacoWorkerFactory: configureDefaultWorkerFactory
    };

    const editorAppConfig: EditorAppConfig = {
        codeResources: {
            modified: {
                text: code,
                uri: codeUri
            },
            original: {
                text: codeOriginal,
                uri: codeOriginalUri,
            }
        }
    };

    // perform global monaco-vscode-api init
    const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await apiWrapper.start();

    const editorApp = new EditorApp(editorAppConfig);
    disableElement('button-swap-code', true);

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            await editorApp.start(vscodeApiConfig.$type, htmlContainer);

            vscode.commands.getCommands().then((x) => {
                console.log(`Found ${x.length} commands`);
                const finding = x.find((elem) => elem === 'actions.find');
                console.log(`Found command: ${finding}`);
            });

            editorApp.getEditor()?.focus();
            await vscode.commands.executeCommand('actions.find');
        });
        document.querySelector('#button-swap-code')?.addEventListener('click', () => {
            const codeResources = editorApp.getConfig().codeResources;
            if (codeResources?.modified?.uri === codeUri) {
                editorApp.updateCodeResources({
                    modified: {
                        text: codeOriginal,
                        uri: codeOriginalUri
                    },
                    original: {
                        text: code,
                        uri: codeUri
                    }
                });
            } else {
                editorApp.updateCodeResources({
                    modified: {
                        text: code,
                        uri: codeUri
                    },
                    original: {
                        text: codeOriginal,
                        uri: codeOriginalUri
                    }
                });
            }
        });
        document.querySelector('#button-diff')?.addEventListener('click', async () => {
            // ensure it is boolean value and not undefined
            const useDiffEditor = editorAppConfig.useDiffEditor ?? false;
            editorAppConfig.useDiffEditor = !useDiffEditor;
            disableElement('button-swap-code', !editorAppConfig.useDiffEditor);

            await editorApp.start(vscodeApiConfig.$type, htmlContainer);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await editorApp.dispose();
        });
    } catch (e) {
        console.error(e);
    }
};


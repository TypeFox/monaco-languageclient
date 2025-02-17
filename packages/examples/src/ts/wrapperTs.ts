/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import '@codingame/monaco-vscode-typescript-basics-default-extension';
import '@codingame/monaco-vscode-typescript-language-features-default-extension';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { type CodePlusUri, MonacoEditorLanguageClientWrapper, type WrapperConfig } from 'monaco-editor-wrapper';
import { configureDefaultWorkerFactory } from 'monaco-editor-wrapper/workers/workerLoaders';

export const runTsWrapper = async () => {
    const codeUri = '/workspace/hello.ts';
    const code = `function sayHello(): string {
    return "Hello";
};`;

    const codeOriginalUri = '/workspace/goodbye.ts';
    const codeOriginal = `function sayGoodbye(): string {
    return "Goodbye";
};`;

    const wrapperConfig: WrapperConfig = {
        $type: 'extended',
        htmlContainer: document.getElementById('monaco-editor-root')!,
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            serviceOverrides: {
                ...getKeybindingsServiceOverride()
            },
            enableExtHostWorker: true,
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
            }
        },
        editorAppConfig: {
            codeResources: {
                modified: {
                    text: code,
                    uri: codeUri
                },
                original: {
                    text: codeOriginal,
                    uri: codeOriginalUri,
                }
            },
            monacoWorkerFactory: configureDefaultWorkerFactory
        }
    };

    const wrapper = new MonacoEditorLanguageClientWrapper();

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            await wrapper.initAndStart(wrapperConfig);

            vscode.commands.getCommands().then((x) => {
                console.log(`Found ${x.length} commands`);
                const finding = x.find((elem) => elem === 'actions.find');
                console.log(`Found command: ${finding}`);
            });

            wrapper.getEditor()?.focus();
            await vscode.commands.executeCommand('actions.find');
        });
        document.querySelector('#button-swap-code')?.addEventListener('click', () => {
            const codeResources = wrapper.getMonacoEditorApp()?.getConfig().codeResources;
            if ((codeResources?.modified as CodePlusUri).uri === codeUri) {
                wrapper.updateCodeResources({
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
                wrapper.updateCodeResources({
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
            const useDiffEditor = wrapperConfig.editorAppConfig!.useDiffEditor ?? false;
            wrapperConfig.editorAppConfig!.useDiffEditor = !useDiffEditor;
            await wrapper.initAndStart(wrapperConfig);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await wrapper.dispose();
        });
    } catch (e) {
        console.error(e);
    }
};


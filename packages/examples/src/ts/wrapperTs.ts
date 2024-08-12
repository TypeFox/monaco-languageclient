/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import '@codingame/monaco-vscode-theme-defaults-default-extension';
import '@codingame/monaco-vscode-typescript-basics-default-extension';
import '@codingame/monaco-vscode-typescript-language-features-default-extension';
import { CodePlusUri, MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        ignoreMapping: true,
        workerLoaders: {
            editorWorkerService: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
        }
    });
};

export const runTsWrapper = async () => {
    const codeUri = '/workspace/hello.ts';
    const code = `function sayHello(): string {
    return "Hello";
};`;

    const codeOriginalUri = '/workspace/goodbye.ts';
    const codeOriginal = `function sayGoodbye(): string {
    return "Goodbye";
};`;

    const userConfig: UserConfig = {
        wrapperConfig: {
            serviceConfig: {
                userServices: {
                    ...getKeybindingsServiceOverride()
                },
                enableExtHostWorker: true,
                debugLogging: true
            },
            editorAppConfig: {
                $type: 'extended',
                codeResources: {
                    main: {
                        text: code,
                        uri: codeUri
                    },
                    original: {
                        text: codeOriginal,
                        uri: codeOriginalUri,
                    }
                },
                useDiffEditor: false,
                userConfiguration: {
                    json: JSON.stringify({
                        'workbench.colorTheme': 'Default Dark Modern',
                        'typescript.tsserver.web.projectWideIntellisense.enabled': true,
                        'typescript.tsserver.web.projectWideIntellisense.suppressSemanticErrors': false,
                        'diffEditor.renderSideBySide': false,
                        'editor.lightbulb.enabled': 'on',
                        'editor.glyphMargin': true,
                        'editor.guides.bracketPairsHorizontal': true
                    })
                }
            }
        }
    };

    const wrapper = new MonacoEditorLanguageClientWrapper();
    const htmlElement = document.getElementById('monaco-editor-root');

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            await wrapper.initAndStart(userConfig, htmlElement);

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
            if ((codeResources?.main as CodePlusUri).uri === codeUri) {
                wrapper.updateCodeResources({
                    main: {
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
                    main: {
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
            const useDiffEditor = userConfig.wrapperConfig.editorAppConfig.useDiffEditor ?? false;
            userConfig.wrapperConfig.editorAppConfig.useDiffEditor = !useDiffEditor;
            await wrapper.initAndStart(userConfig, htmlElement);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await wrapper.dispose();
        });
    } catch (e) {
        console.error(e);
    }
};


/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import * as monaco from 'monaco-editor';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import '@codingame/monaco-vscode-theme-defaults-default-extension';
import '@codingame/monaco-vscode-typescript-basics-default-extension';
import '@codingame/monaco-vscode-typescript-language-features-default-extension';
import { disposeEditor, getWrapper, startEditor, swapEditors, updateModel } from '../common/example-apps-common.js';
import { UserConfig } from 'monaco-editor-wrapper';
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
    let code = `function sayHello(): string {
    return "Hello";
};`;

    const codeOriginalUri = '/workspace/goodbye.ts';
    let codeOriginal = `function sayGoodbye(): string {
    return "Goodbye";
};`;

    const monacoEditorConfig = {
        glyphMargin: true,
        guides: {
            bracketPairs: true
        },
        lightbulb: {
            enabled: monaco.editor.ShowLightbulbIconMode.On
        },
        theme: 'vs-dark'
    };

    const monacoDiffEditorConfig = {
        ...monacoEditorConfig,
        renderSideBySide: false
    };

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
                languageId: 'typescript',
                code,
                codeUri: codeUri,
                codeOriginal: codeOriginal,
                useDiffEditor: false,
                editorOptions: monacoEditorConfig,
                diffEditorOptions: monacoDiffEditorConfig
            }
        }
    };

    try {
        const wrapper = getWrapper();
        const htmlElement = document.getElementById('monaco-editor-root');
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            await startEditor(userConfig, htmlElement, code, codeOriginal);

            vscode.commands.getCommands().then((x) => {
                console.log(`Found ${x.length} commands`);
                const finding = x.find((elem) => elem === 'actions.find');
                console.log(`Found command: ${finding}`);
            });

            wrapper.getEditor()?.focus();
            await vscode.commands.executeCommand('actions.find');
        });
        document.querySelector('#button-swap')?.addEventListener('click', () => {
            swapEditors(userConfig, htmlElement, code, codeOriginal);
        });
        document.querySelector('#button-swap-code')?.addEventListener('click', () => {
            if (wrapper.getMonacoEditorApp()?.getConfig().codeUri === codeUri) {
                updateModel({
                    code: codeOriginal,
                    codeUri: codeOriginalUri,
                    languageId: 'typescript',
                });
            } else {
                updateModel({
                    code: code,
                    codeUri: codeUri,
                    languageId: 'typescript',
                });
            }
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            if (wrapper.getMonacoEditorApp()?.getConfig().codeUri === codeUri) {
                code = await disposeEditor(userConfig.wrapperConfig.editorAppConfig.useDiffEditor);
            } else {
                codeOriginal = await disposeEditor(userConfig.wrapperConfig.editorAppConfig.useDiffEditor);
            }
        });
    } catch (e) {
        console.error(e);
    }
};


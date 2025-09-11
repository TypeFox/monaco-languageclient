/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import 'vscode/localExtensionHost';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
// this is required syntax highlighting
import '@codingame/monaco-vscode-json-default-extension';
import '@codingame/monaco-vscode-python-default-extension';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { EditorApp, type EditorAppConfig } from 'monaco-languageclient/editorApp';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { disableElement } from '../common/client/utils.js';
import { createJsonLanguageClientConfig, createPythonLanguageClientConfig } from './config.js';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { LanguageClientsManager } from 'monaco-languageclient/lcwrapper';

export const runMultipleLanguageClientsExample = async () => {
    disableElement('button-flip', true);

    const textJson = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": {"value": "unix"}
}`;

    const textPython = `from hello2 import print_hello

print_hello()
print("Hello Moon!")
`;

    let currentText = textJson;
    let currenFileExt = 'json';

    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        viewsConfig: {
            $type: 'EditorService',
            htmlContainer: document.getElementById('monaco-editor-root')!
        },
        logLevel: LogLevel.Debug,
        serviceOverrides: {
            ...getKeybindingsServiceOverride()
        },
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern',
                'editor.wordBasedSuggestions': 'off',
                'editor.experimental.asyncTokenization': true
            })
        },
        monacoWorkerFactory: configureDefaultWorkerFactory
    };

    const editorAppConfig: EditorAppConfig = {
        id: '42',
        codeResources: {
            modified: {
                text: currentText,
                uri: `/workspace/example.${currenFileExt}`
            }
        }
    };

    // perform global monaco-vscode-api init
    const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await apiWrapper.start();

    const lcManager = new LanguageClientsManager();
    const languageClientConfigs = {
        configs: {
            json: createJsonLanguageClientConfig(),
            python: createPythonLanguageClientConfig()
        }
    };

    const editorApp = new EditorApp(editorAppConfig);

    document.querySelector('#button-start')?.addEventListener('click', async () => {
        try {
            disableElement('button-start', true);
            disableElement('button-flip', false);

            await editorApp.start(apiWrapper.getHtmlContainer());
            if (editorAppConfig.codeResources?.modified !== undefined) {
                editorAppConfig.codeResources.modified.text = currentText;
                editorAppConfig.codeResources.modified.uri = `/workspace/example.${currenFileExt}`;
            }

            // init and start language clients after start
            await lcManager.setConfigs(languageClientConfigs);
            await lcManager.start();
        } catch (e) {
            console.error(e);
        }
    });
    document.querySelector('#button-dispose')?.addEventListener('click', async () => {
        disableElement('button-flip', true);
        disableElement('button-dispose', true);
        disableElement('button-start', false);

        await editorApp.dispose();
        await lcManager.dispose();
    });
    document.querySelector('#button-flip')?.addEventListener('click', async () => {
        currentText = currentText === textJson ? textPython : textJson;
        currenFileExt = currenFileExt === 'json' ? 'py' : 'json';
        editorApp.updateCodeResources({
            modified: {
                text: currentText,
                uri: `/workspace/example.${currenFileExt}`
            }
        });
    });

};

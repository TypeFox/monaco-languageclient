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
import { type CodePlusFileExt, MonacoEditorLanguageClientWrapper, type WrapperConfig } from 'monaco-editor-wrapper';
import { configureMonacoWorkers, disableElement } from '../common/client/utils.js';
import { createJsonLanguageClientConfig, createPythonLanguageClientConfig } from './config.js';

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

    const wrapperConfig: WrapperConfig = {
        id: '42',
        $type: 'extended',
        htmlContainer: document.getElementById('monaco-editor-root')!,
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            serviceOverrides: {
                ...getKeybindingsServiceOverride()
            },
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'Default Dark Modern',
                    'editor.wordBasedSuggestions': 'off',
                    'editor.experimental.asyncTokenization': true
                })
            }
        },
        editorAppConfig: {
            codeResources: {
                modified: {
                    text: currentText,
                    fileExt: currenFileExt
                }
            },
            monacoWorkerFactory: configureMonacoWorkers
        },
        languageClientConfigs: {
            json: createJsonLanguageClientConfig(),
            python: createPythonLanguageClientConfig()
        }
    };

    const wrapper = new MonacoEditorLanguageClientWrapper();

    document.querySelector('#button-start')?.addEventListener('click', async () => {
        try {
            disableElement('button-start', true);
            disableElement('button-flip', false);
            disableElement('checkbox-extlc', true);

            const externalLc = (document.getElementById('checkbox-extlc')! as HTMLInputElement).checked;

            await wrapper.initAndStart(wrapperConfig, !externalLc);
            if (wrapperConfig.editorAppConfig?.codeResources?.modified !== undefined) {
                (wrapperConfig.editorAppConfig.codeResources.modified as CodePlusFileExt).text = currentText;
                (wrapperConfig.editorAppConfig.codeResources.modified as CodePlusFileExt).fileExt = currenFileExt;
            }

            // init language clients after start
            if (externalLc === true) {
                wrapper.initLanguageClients();
                await wrapper.startLanguageClients();
            }
        } catch (e) {
            console.error(e);
        }
    });
    document.querySelector('#button-dispose')?.addEventListener('click', async () => {
        disableElement('button-flip', true);
        disableElement('button-dispose', true);
        disableElement('button-start', false);

        await wrapper.dispose();
    });
    document.querySelector('#button-flip')?.addEventListener('click', async () => {
        currentText = currentText === textJson ? textPython : textJson;
        currenFileExt = currenFileExt === 'json' ? 'py' : 'json';
        wrapper.updateCodeResources({
            modified: {
                text: currentText,
                fileExt: currenFileExt
            }
        });
    });

};

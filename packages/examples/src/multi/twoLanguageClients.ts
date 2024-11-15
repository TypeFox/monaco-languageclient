/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import 'vscode/localExtensionHost';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
// this is required syntax highlighting
import '@codingame/monaco-vscode-json-default-extension';
import '@codingame/monaco-vscode-python-default-extension';
import { LogLevel } from 'vscode/services';
import { CodePlusFileExt, configureAndInitVscodeApi, LanguageClientWrapper, MonacoEditorLanguageClientWrapper, WrapperConfig } from 'monaco-editor-wrapper';
import { configureMonacoWorkers, disableButton } from '../common/client/utils.js';
import { createJsonLanguageClientConfig, createPythonLanguageClientConfig } from './config.js';

export const runMultipleLanguageClientsExample = async () => {
    disableButton('button-flip', true);

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

    const lccJson = createJsonLanguageClientConfig();
    const lccPython = createPythonLanguageClientConfig();

    let lcwJson: LanguageClientWrapper | undefined;
    let lcwPython: LanguageClientWrapper | undefined;

    const wrapperConfig: WrapperConfig = {
        id: '42',
        logLevel: LogLevel.Debug,
        htmlContainer: document.getElementById('monaco-editor-root')!,
        vscodeApiConfig: {
            enableTextmate: true,
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
            $type: 'extended',
            codeResources: {
                main: {
                    text: currentText,
                    fileExt: currenFileExt
                }
            },
            monacoWorkerFactory: configureMonacoWorkers
        }
    };

    const wrapper = new MonacoEditorLanguageClientWrapper();

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            wrapperConfig.vscodeApiConfig.vscodeApiInitPerformExternally = (document.getElementById('checkbox-extlc')! as HTMLInputElement).checked;
            if (wrapperConfig.vscodeApiConfig.vscodeApiInitPerformExternally === true) {

                const logger = wrapper.getLogger();
                logger.setLevel(wrapperConfig.logLevel!);
                await configureAndInitVscodeApi({
                    vscodeApiConfig: wrapperConfig.vscodeApiConfig!,
                    logLevel: wrapperConfig.logLevel!,
                }, {
                    htmlContainer: wrapperConfig.htmlContainer,
                    caller: 'runMultipleLanguageClientsExample',
                    logger
                });

                if (lcwJson === undefined) {
                    lcwJson = new LanguageClientWrapper({
                        languageClientConfig: lccJson
                    });
                    await lcwJson.start();
                }
                if (lcwPython === undefined) {
                    lcwPython = new LanguageClientWrapper({
                        languageClientConfig: lccPython
                    });
                    await lcwPython.start();
                }
            } else {
                wrapperConfig.languageClientConfigs = {
                    json: lccJson,
                    python: lccPython
                };
            }

            await wrapper.initAndStart(wrapperConfig);
            if (wrapperConfig.editorAppConfig.codeResources?.main !== undefined) {
                (wrapperConfig.editorAppConfig.codeResources.main as CodePlusFileExt).text = currentText;
                (wrapperConfig.editorAppConfig.codeResources.main as CodePlusFileExt).fileExt = currenFileExt;
            }

            disableButton('button-flip', false);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await wrapper.dispose();
            disableButton('button-flip', true);
        });
        document.querySelector('#button-flip')?.addEventListener('click', async () => {
            currentText = currentText === textJson ? textPython : textJson;
            currenFileExt = currenFileExt === 'json' ? 'py' : 'json';
            wrapper.updateCodeResources({
                main: {
                    text: currentText,
                    fileExt: currenFileExt
                }
            });
        });
    } catch (e) {
        console.error(e);
    }
};

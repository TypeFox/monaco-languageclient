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
import { CodePlusFileExt, configureAndInitVscodeApi, disposeLanguageClients, LanguageClientWrapper, MonacoEditorLanguageClientWrapper, WrapperConfig } from 'monaco-editor-wrapper';
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
    const lcwJson = new LanguageClientWrapper({
        languageClientConfig: lccJson
    });
    const lccPython = createPythonLanguageClientConfig();
    const lcwPython = new LanguageClientWrapper({
        languageClientConfig: lccPython
    });

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
        }
    };

    const wrapper = new MonacoEditorLanguageClientWrapper();

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            wrapperConfig.vscodeApiConfig!.vscodeApiInitPerformExternally = (document.getElementById('checkbox-extlc')! as HTMLInputElement).checked;
            if (wrapperConfig.vscodeApiConfig!.vscodeApiInitPerformExternally === true) {

                const logger = wrapper.getLogger();
                logger.setLevel(wrapperConfig.logLevel!);
                await configureAndInitVscodeApi(wrapperConfig.$type, {
                    vscodeApiConfig: wrapperConfig.vscodeApiConfig!,
                    logLevel: wrapperConfig.logLevel!,
                }, {
                    htmlContainer: wrapperConfig.htmlContainer,
                    caller: 'runMultipleLanguageClientsExample',
                    logger
                });

                const allPromises: Array<Promise<void>> = [];
                if (!lcwJson.isStarted()) {
                    allPromises.push(lcwJson.start());
                }
                if (!lcwPython.isStarted()) {
                    allPromises.push(lcwPython.start());
                }
                await Promise.all(allPromises);
            } else {
                wrapperConfig.languageClientConfigs = {
                    json: lccJson,
                    python: lccPython
                };
            }

            await wrapper.initAndStart(wrapperConfig);
            if (wrapperConfig.editorAppConfig?.codeResources?.modified !== undefined) {
                (wrapperConfig.editorAppConfig.codeResources.modified as CodePlusFileExt).text = currentText;
                (wrapperConfig.editorAppConfig.codeResources.modified as CodePlusFileExt).fileExt = currenFileExt;
            }

            disableButton('button-flip', false);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            disableButton('button-flip', true);

            wrapperConfig.vscodeApiConfig!.vscodeApiInitPerformExternally = (document.getElementById('checkbox-extlc')! as HTMLInputElement).checked;
            if (wrapperConfig.vscodeApiConfig!.vscodeApiInitPerformExternally === true) {
                disposeLanguageClients([lcwJson, lcwPython], false);
            }
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
    } catch (e) {
        console.error(e);
    }
};

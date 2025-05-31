/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';
import { delayExecution } from 'monaco-languageclient/common';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { setupLangiumClientExtended } from './config/extendedConfig.js';
import { setupLangiumClientClassic } from './config/classicConfig.js';
import { disableElement, type ExampleAppConfig } from '../../common/client/utils.js';
import text from '../../../resources/langium/langium-dsl/example.langium?raw';
import workerUrl from './worker/langium-server?worker&url';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';

export const runLangiumDslWrapper = async (extendedMode: boolean) => {
    try {
        let wrapper: MonacoEditorLanguageClientWrapper | undefined;

        const loadLangiumWorker = () => {
            console.log(`Langium worker URL: ${workerUrl}`);
            return new Worker(workerUrl, {
                type: 'module',
                name: 'Langium LS',
            });
        };

        const checkStarted = () => {
            if (wrapper?.isStarted() ?? false) {
                alert('Editor was already started!\nPlease reload the page to test the alternative editor.');
                return true;
            }
            return false;
        };

        const startLangiumClient = async () => {
            if (checkStarted()) return;
            disableElement('button-start', true);

            const worker = loadLangiumWorker();
            const reader = new BrowserMessageReader(worker);
            const writer = new BrowserMessageWriter(worker);
            reader.listen((message) => {
                console.log('Received message from worker:', message);
            });

            let appConfig: ExampleAppConfig;
            if (extendedMode) {
                appConfig = setupLangiumClientExtended({
                    worker,
                    messageTransports: { reader, writer }
                });
            } else {
                appConfig = setupLangiumClientClassic({
                    worker,
                    messageTransports: { reader, writer }
                });
            }
            // perform global init
            const apiWrapper = new MonacoVscodeApiWrapper(appConfig.vscodeApiConfig);
            await apiWrapper.init();

            // init language client
            const lcWrapper = new LanguageClientWrapper(appConfig.languageClientConfig);
            await lcWrapper.start();

            // run wrapper
            wrapper = new MonacoEditorLanguageClientWrapper();
            await wrapper.initAndStart(appConfig.wrapperConfig, appConfig.vscodeApiConfig.htmlContainer!);

            await delayExecution(1000);
            await wrapper.updateCodeResources({
                modified: {
                    text: `// modified file\n\n${text}`,
                    uri: '/workspace/mod.langium',
                    enforceLanguageId: 'langium'
                }
            });
        };

        const disposeEditor = async () => {
            if (!wrapper) return;
            wrapper.reportStatus();
            await wrapper.dispose();
            wrapper = undefined;
            disableElement('button-start', false);
        };

        document.querySelector('#button-start')?.addEventListener('click', startLangiumClient);
        document.querySelector('#button-dispose')?.addEventListener('click', disposeEditor);
    } catch (e) {
        console.error(e);
    }
};


/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { setupLangiumClientExtended } from './config/extendedConfig.js';
import { setupLangiumClientClassic } from './config/classicConfig.js';
import { disableElement } from '../../common/client/utils.js';

import workerUrl from './worker/langium-server?worker&url';

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

            const langiumWorker = loadLangiumWorker();

            if (extendedMode) {
                const config = await setupLangiumClientExtended(langiumWorker);
                wrapper = new MonacoEditorLanguageClientWrapper();
                wrapper.initAndStart(config);
            } else {
                const config = await setupLangiumClientClassic(langiumWorker);
                wrapper = new MonacoEditorLanguageClientWrapper();
                await wrapper.initAndStart(config);
            }
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


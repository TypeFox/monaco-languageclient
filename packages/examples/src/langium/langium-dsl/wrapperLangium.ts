/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { setupLangiumClientExtended } from './config/extendedConfig.js';
import { setupLangiumClientClassic } from './config/classicConfig.js';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';

let wrapper: MonacoEditorLanguageClientWrapper | undefined;
let extended = false;
const htmlElement = document.getElementById('monaco-editor-root');

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        basePath: '../../../node_modules'
    });
};

export const runLangiumDslWrapper = async () => {
    try {
        document.querySelector('#button-start-classic')?.addEventListener('click', startLangiumClientClassic);
        document.querySelector('#button-start-extended')?.addEventListener('click', startLangiumClientExtended);
        document.querySelector('#button-dispose')?.addEventListener('click', disposeEditor);
    } catch (e) {
        console.error(e);
    }
};

export const startLangiumClientExtended = async () => {
    try {
        if (checkStarted()) return;
        extended = true;
        disableButton('button-start-classic', true);
        disableButton('button-start-extended', true);
        const config = await setupLangiumClientExtended();
        wrapper = new MonacoEditorLanguageClientWrapper();
        wrapper.initAndStart(config, htmlElement);
    } catch (e) {
        console.log(e);
    }
};

export const startLangiumClientClassic = async () => {
    try {
        if (checkStarted()) return;
        disableButton('button-start-classic', true);
        disableButton('button-start-extended', true);
        const config = await setupLangiumClientClassic();
        wrapper = new MonacoEditorLanguageClientWrapper();
        await wrapper.initAndStart(config, htmlElement!);
    } catch (e) {
        console.log(e);
    }
};

const checkStarted = () => {
    if (wrapper?.isStarted()) {
        alert('Editor was already started!\nPlease reload the page to test the alternative editor.');
        return true;
    }
    return false;
};

const disableButton = (id: string, disabled: boolean) => {
    const button = document.getElementById(id) as HTMLButtonElement;
    if (button !== null) {
        button.disabled = disabled;
    }
};

export const disposeEditor = async () => {
    if (!wrapper) return;
    wrapper.reportStatus();
    await wrapper.dispose();
    wrapper = undefined;
    if (extended) {
        disableButton('button-start-extended', false);
    } else {
        disableButton('button-start-classic', false);
    }
};

export const loadLangiumWorker = () => {
    // Language Server preparation
    const workerUrl = new URL('./src/langium/langium-dsl/worker/langium-server.ts', window.location.href);
    console.log(`Langium worker URL: ${workerUrl}`);

    return new Worker(workerUrl, {
        type: 'module',
        name: 'Langium LS',
    });
};

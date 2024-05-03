/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { CodeResources, MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import * as monaco from 'monaco-editor';

const wrapper = new MonacoEditorLanguageClientWrapper();

export const startEditor = async (userConfig: UserConfig, htmlElement: HTMLElement | null, code: string, codeOriginal?: string) => {
    if (wrapper.isStarted()) {
        console.warn('Editor was already started!');
    } else {
        configureCodeEditors(userConfig, code, codeOriginal);
        toggleSwapDiffButton(true);
        await restartEditor(userConfig, htmlElement);
    }
};

export const getWrapper = () => {
    return wrapper;
};

export const updateModel = async (codeResources: CodeResources) => {
    if (wrapper.getMonacoEditorApp()?.getConfig().useDiffEditor) {
        await wrapper.updateDiffModel(codeResources);
    } else {
        await wrapper.updateModel(codeResources);
    }
};

export const swapEditors = async (userConfig: UserConfig, htmlElement: HTMLElement | null, code: string, codeOriginal?: string) => {
    userConfig.wrapperConfig.editorAppConfig.useDiffEditor = !userConfig.wrapperConfig.editorAppConfig.useDiffEditor;
    saveMainCode(!userConfig.wrapperConfig.editorAppConfig.useDiffEditor);
    configureCodeEditors(userConfig, code, codeOriginal);
    await restartEditor(userConfig, htmlElement);
};

export const disposeEditor = async (useDiffEditor: boolean) => {
    wrapper.reportStatus();
    toggleSwapDiffButton(false);
    const codeMain = saveMainCode(useDiffEditor);

    await wrapper.dispose();
    return codeMain;
};

const restartEditor = async (userConfig: UserConfig, htmlElement: HTMLElement | null) => {
    await wrapper.dispose();
    await wrapper.initAndStart(userConfig, htmlElement);
    logEditorInfo(userConfig);
};

const configureCodeEditors = (userConfig: UserConfig, code: string, codeOriginal?: string) => {
    const codeResources = userConfig.wrapperConfig.editorAppConfig.codeResources;
    if (codeResources.main) {
        codeResources.main.text = code;
    }
    if (userConfig.wrapperConfig.editorAppConfig.useDiffEditor && codeResources.original && codeOriginal) {
        codeResources.original.text = codeOriginal;
    }
};

const saveMainCode = (saveFromDiff: boolean) => {
    if (saveFromDiff) {
        return wrapper.getModel(true)!.getValue();
    } else {
        return wrapper.getModel()!.getValue();
    }
};

const toggleSwapDiffButton = (enabled: boolean) => {
    const button = document.getElementById('button-swap') as HTMLButtonElement;
    if (button !== null) {
        button.disabled = !enabled;
    }
};

const logEditorInfo = (userConfig: UserConfig) => {
    console.log(`# of configured languages: ${monaco.languages.getLanguages().length}`);
    console.log(`Main code: ${wrapper.getModel(true)?.getValue() ?? ''}`);
    if (userConfig.wrapperConfig.editorAppConfig.useDiffEditor) {
        console.log(`Modified code: ${wrapper.getModel()!.getValue()}`);
    }
};

export const getTextContent = async (url: URL) => {
    const response = await fetch(url.href);
    return response.text();
};

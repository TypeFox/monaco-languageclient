/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ModelUpdate, MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import { languages } from 'monaco-editor';

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

export const updateModel = async (modelUpdate: ModelUpdate) => {
    if (wrapper.getMonacoEditorApp()?.getConfig().useDiffEditor) {
        await wrapper.updateDiffModel(modelUpdate);
    } else {
        await wrapper.updateModel(modelUpdate);
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
    if (userConfig.wrapperConfig.editorAppConfig.useDiffEditor) {
        userConfig.wrapperConfig.editorAppConfig.code = code;
        userConfig.wrapperConfig.editorAppConfig.codeOriginal = codeOriginal;
    } else {
        userConfig.wrapperConfig.editorAppConfig.code = code;
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
    console.log(`# of configured languages: ${languages.getLanguages().length}`);
    console.log(`Main code: ${wrapper.getModel(true)?.getValue() ?? ''}`);
    if (userConfig.wrapperConfig.editorAppConfig.useDiffEditor) {
        console.log(`Modified code: ${wrapper.getModel()!.getValue()}`);
    }
};

export const getTextContent = async (url: URL) => {
    const response = await fetch(url.href);
    return response.text();
};

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { UserConfig, EditorAppType, EditorAppExtended, MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';

export const createMonacoEditorDiv = () => {
    const div = document.createElement('div');
    div.id = 'monaco-editor-root';
    document.body.insertAdjacentElement('beforeend', div);
};

export const createBaseConfig = (type: EditorAppType): UserConfig => {
    return {
        wrapperConfig: createWrapperConfig(type)
    };
};

export const createWrapperConfig = (type: EditorAppType) => {
    return {
        editorAppConfig: createEditorAppConfig(type)
    };
};

export const createEditorAppConfig = (type: EditorAppType) => {
    return {
        $type: type,
        languageId: 'my-lang',
        code: '',
        useDiffEditor: false,
    };
};

export const updateExtendedAppPrototyp = async () => {
    EditorAppExtended.prototype.specifyServices = async () => {
        console.log('Using overriden EditorAppExtended.prototype.specifyServices');
        return Promise.resolve({});
    };
};

/**
 * WA: Create an instance for testing that does not specify any additional services.
 *
 * Prevents:
 * Error: Unable to load extension-file://vscode.theme-defaults/themes/light_modern.json:
 * Unable to read file 'extension-file://vscode.theme-defaults/themes/light_modern.json' (TypeError: Failed to fetch)
 */
export const createWrapper = async (userConfig: UserConfig) => {
    updateExtendedAppPrototyp();
    const wrapper = new MonacoEditorLanguageClientWrapper();
    await wrapper.init(userConfig);
    return wrapper;
};

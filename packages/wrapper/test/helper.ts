/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { UserConfig, EditorAppType } from 'monaco-editor-wrapper';

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
        codeResources: {
            main: {
                text: '',
                fileExt: 'js'
            }
        },
        useDiffEditor: false,
    };
};

/**
 * Helper to generate a quick worker from a function blob
 */
export const createWorkerFromFunction = (fn: () => void): Worker => {
    return new Worker(URL.createObjectURL(
        new Blob([`(${fn.toString()})()`], { type: 'application/javascript' })
    ));
};

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { EditorAppType, WrapperConfig } from 'monaco-editor-wrapper';

export const createMonacoEditorDiv = () => {
    const div = document.createElement('div');
    div.id = 'monaco-editor-root';
    document.body.insertAdjacentElement('beforeend', div);
};

export const createBaseConfig = (type: EditorAppType): WrapperConfig => {
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

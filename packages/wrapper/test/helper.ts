/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { WrapperConfig } from 'monaco-editor-wrapper';

export const createMonacoEditorDiv = () => {
    const div = document.createElement('div');
    div.id = 'monaco-editor-root';
    document.body.insertAdjacentElement('beforeend', div);
};

export const createWrapperConfigExtendedApp = (): WrapperConfig => {
    return {
        editorAppConfig: {
            loadThemes: false,
            $type: 'extended',
            codeResources: {
                main: {
                    text: '',
                    fileExt: 'js'
                }
            },
            useDiffEditor: false,
        }
    };
};

export const createWrapperConfigClassicApp = (): WrapperConfig => {
    return {
        editorAppConfig: {
            $type: 'classic',
            codeResources: {
                main: {
                    text: '',
                    fileExt: 'js'
                }
            },
            useDiffEditor: false,
        }
    };
};

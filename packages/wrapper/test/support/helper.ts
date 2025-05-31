/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { CodeResources, WrapperConfig } from 'monaco-editor-wrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import type { MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';

export const createDefaultMonacoVscodeApiConfig = (): MonacoVscodeApiConfig => {
    return {
        $type: 'extended',
        advanced: {
            loadThemes: false,
        },
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern'
            })
        },
        htmlContainer: document.body,
        serviceOverrides: {},
        monacoWorkerFactory: configureDefaultWorkerFactory
    };
};

export const createWrapperConfigClassicApp = (codeResources: CodeResources): WrapperConfig => {
    return {
        $type: 'classic',
        editorAppConfig: {
            codeResources,
            editorOptions: {},
        }
    };
};

export const createMonacoEditorDiv = () => {
    const div = document.createElement('div');
    div.id = 'monaco-editor-root';
    document.body.insertAdjacentElement('beforeend', div);
    return div;
};

export const createWrapperConfigExtendedApp = (codeResources: CodeResources): WrapperConfig => {
    return {
        $type: 'extended',
        editorAppConfig: {
            codeResources
        }
    };
};


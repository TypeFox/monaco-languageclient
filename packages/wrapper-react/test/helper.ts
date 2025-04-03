/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import type { CodeResources, WrapperConfig } from 'monaco-editor-wrapper';
import { configureDefaultWorkerFactory } from 'monaco-editor-wrapper/workers/workerLoaders';

export const createDefaultWrapperConfig = (codeResources: CodeResources): WrapperConfig => {
    return {
        $type: 'extended',
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            loadThemes: false
        },
        editorAppConfig: {
            codeResources,
            monacoWorkerFactory: configureDefaultWorkerFactory
        }
    };
};

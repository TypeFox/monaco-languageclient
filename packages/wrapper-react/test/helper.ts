/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import type { WrapperConfig } from 'monaco-editor-wrapper';
import { configureDefaultWorkerFactory } from 'monaco-editor-wrapper/workers/workerLoaders';

export const createDefaultWrapperConfig = (): WrapperConfig => {
    return {
        $type: 'extended',
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            loadThemes: false
        },
        editorAppConfig: {
            codeResources: {
                modified: {
                    text: 'hello world',
                    uri: '/workspace/test.js'
                }
            },
            monacoWorkerFactory: configureDefaultWorkerFactory
        }
    };
};

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { MessageTransports } from 'vscode-languageclient';
import type { Logger } from 'monaco-languageclient/common';
import type { MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import type { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { defineDefaultWorkerLoaders, useWorkerFactory } from 'monaco-languageclient/workerFactory';
import { LangiumMonarchContent } from './langium.monarch.js';
import code from '../../../../resources/langium/langium-dsl/example.langium?raw';
import type { ExampleAppConfig } from '../../../common/client/utils.js';
import type { EditorAppConfig } from 'monaco-languageclient/editorApp';

export const setupLangiumClientClassic = (params: {
    worker: Worker
    messageTransports?: MessageTransports,
}): ExampleAppConfig => {

    const workerLoaders = defineDefaultWorkerLoaders();
    workerLoaders.TextMateWorker = undefined;

    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'classic',
        logLevel: LogLevel.Debug,
        htmlContainer: document.getElementById('monaco-editor-root')!,
        serviceOverrides: {
            ...getKeybindingsServiceOverride()
        },
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'GitHub Dark High Contrast',
                'editor.guides.bracketPairsHorizontal': 'active',
                'editor.wordBasedSuggestions': 'off',
                'editor.experimental.asyncTokenization': true,
                'vitest.disableWorkspaceWarning': true
            })
        },
        monacoWorkerFactory: (logger?: Logger) => {
            useWorkerFactory({
                workerLoaders,
                logger
            });
        }
    };

    const languageClientConfig: LanguageClientConfig = {
        clientOptions: {
            documentSelector: ['langium']
        },
        connection: {
            options: {
                $type: 'WorkerDirect',
                worker: params.worker
            },
            messageTransports: params.messageTransports
        }
    };

    const editorAppConfig: EditorAppConfig = {
        $type: vscodeApiConfig.$type,
        codeResources: {
            modified: {
                text: code,
                uri: '/workspace/grammar.langium',
                enforceLanguageId: 'langium'
            }
        },
        editorOptions: {
            'semanticHighlighting.enabled': true,
            wordBasedSuggestions: 'off',
            theme: 'vs-dark'
        },
        languageDef: {
            monarchLanguage: LangiumMonarchContent,
            languageExtensionConfig: { id: 'langium' }
        }
    };

    return {
        editorAppConfig,
        vscodeApiConfig,
        languageClientConfig
    };
};

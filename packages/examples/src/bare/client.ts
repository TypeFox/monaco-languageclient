/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import * as monaco from '@codingame/monaco-vscode-editor-api';
import type { Logger } from 'monaco-languageclient/common';
import { LanguageClientWrapper, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { defineDefaultWorkerLoaders, useWorkerFactory } from 'monaco-languageclient/workerFactory';

export const runClient = async () => {
    const htmlContainer = document.getElementById('monaco-editor-root')!;
    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'classic',
        logLevel: LogLevel.Debug,
        userConfiguration: {
            json: JSON.stringify({
                'editor.experimental.asyncTokenization': true
            })
        },
        viewsConfig: {
            $type: 'EditorService',
            htmlContainer
        },
        monacoWorkerFactory: configureClassicWorkerFactory
    };

    const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await apiWrapper.start();

    // register the JSON language with Monaco
    monaco.languages.register({
        id: 'json',
        extensions: ['.json', '.jsonc'],
        aliases: ['JSON', 'json'],
        mimetypes: ['application/json']
    });

    // create monaco editor
    monaco.editor.create(htmlContainer, {
        value: `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": "unix"
}`,
        language: 'json',
        automaticLayout: true,
        wordBasedSuggestions: 'off'
    });

    const languageClientConfig: LanguageClientConfig = {
        clientOptions: {
            documentSelector: ['json']
        },
        connection: {
            options: {
                $type: 'WebSocketUrl',
                url: 'ws://localhost:30000/sampleServer'
            }
        }
    };
    const languageClientWrapper = new LanguageClientWrapper(
        languageClientConfig,
        apiWrapper.getLogger()
    );
    await languageClientWrapper.start();
};

export const configureClassicWorkerFactory = (logger?: Logger) => {
    const defaultworkerLoaders = defineDefaultWorkerLoaders();
    // remove textmate worker as it is not compatible with classic mode
    defaultworkerLoaders.TextMateWorker = undefined;
    useWorkerFactory({
        workerLoaders: defaultworkerLoaders,
        logger
    });
};

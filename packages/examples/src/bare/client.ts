/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from '@codingame/monaco-vscode-editor-api';
import { initServices } from 'monaco-languageclient/vscode/services';
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import { LogLevel } from '@codingame/monaco-vscode-api';
// monaco-editor does not supply json highlighting with the json worker,
// that's why we use the textmate extension from VSCode
import '@codingame/monaco-vscode-json-default-extension';
import { ConsoleLogger } from 'monaco-languageclient/tools';
import { configureDefaultWorkerFactory } from 'monaco-editor-wrapper/workers/workerLoaders';
import { LanguageClientWrapper, type LanguageClientConfig } from 'monaco-editor-wrapper';

export const runClient = async () => {
    const logger = new ConsoleLogger(LogLevel.Debug);
    const htmlContainer = document.getElementById('monaco-editor-root')!;
    await initServices({
        serviceOverrides: {
            ...getTextmateServiceOverride(),
            ...getThemeServiceOverride()
        },
        userConfiguration: {
            json: JSON.stringify({
                'editor.experimental.asyncTokenization': true
            })
        },
    }, {
        logger
    });

    // register the JSON language with Monaco
    monaco.languages.register({
        id: 'json',
        extensions: ['.json', '.jsonc'],
        aliases: ['JSON', 'json'],
        mimetypes: ['application/json']
    });

    configureDefaultWorkerFactory(logger);

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
    const languageClientWrapper = new LanguageClientWrapper({
        languageClientConfig,
        logger
    });

    await languageClientWrapper.start();
};

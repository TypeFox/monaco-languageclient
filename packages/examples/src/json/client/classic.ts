/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import type { ILogger } from '@codingame/monaco-vscode-log-service-override';
import { EditorApp, type EditorAppConfig } from 'monaco-languageclient/editorApp';
import { LanguageClientWrapper, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { defineDefaultWorkerLoaders, useWorkerFactory } from 'monaco-languageclient/workerFactory';

export const runClient = async () => {
    const htmlContainer = document.getElementById('monaco-editor-root')!;
    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'classic',
        viewsConfig: {
            $type: 'EditorService',
            htmlContainer
        },
        logLevel: LogLevel.Debug,
        userConfiguration: {
            json: JSON.stringify({
                'editor.experimental.asyncTokenization': true
            })
        },
        monacoWorkerFactory: configureClassicWorkerFactory
    };

    const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await apiWrapper.start();

    const languageId = 'json';
    const code = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": "unix"
}`;
    const codeUri = '/workspace/model.json';
    const editorAppConfig: EditorAppConfig = {
        codeResources: {
            modified: {
                text: code,
                uri: codeUri
            }
        },
        languageDef: {
            languageExtensionConfig: {
                id: languageId,
                extensions: ['.json', '.jsonc'],
                aliases: ['JSON', 'json'],
                mimetypes: ['application/json']
            }
        }
    };
    const editorApp = new EditorApp(editorAppConfig);
    await editorApp.start(htmlContainer);

    const languageClientConfig: LanguageClientConfig = {
        languageId,
        clientOptions: {
            documentSelector: [languageId]
        },
        connection: {
            options: {
                $type: 'WebSocketUrl',
                url: 'ws://localhost:30000/sampleServer'
            }
        }
    };
    const languageClientWrapper = new LanguageClientWrapper(languageClientConfig);
    await languageClientWrapper.start();
};

export const configureClassicWorkerFactory = (logger?: ILogger) => {
    const defaultworkerLoaders = defineDefaultWorkerLoaders();
    // remove textmate worker as it is not compatible with classic mode
    defaultworkerLoaders.TextMateWorker = undefined;
    defaultworkerLoaders.extensionHostWorkerMain = undefined;
    useWorkerFactory({
        workerLoaders: defaultworkerLoaders,
        logger
    });
};

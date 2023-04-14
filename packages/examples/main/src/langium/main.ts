/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
// support all editor features
import 'monaco-editor/esm/vs/editor/edcore.main.js';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { buildWorkerDefinition } from 'monaco-editor-workers';

import { MonacoLanguageClient, initServices } from 'monaco-languageclient';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver-protocol/browser.js';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient';

import { createConfiguredEditor } from 'vscode/monaco';
import { registerExtension } from 'vscode/extensions';
import { updateUserConfiguration } from 'vscode/service-override/configuration';
import getKeybindingsServiceOverride from 'vscode/service-override/keybindings';
import 'vscode/default-extensions/theme-defaults';

buildWorkerDefinition('../../../node_modules/monaco-editor-workers/dist/workers/', new URL('', window.location.href).href, false);

const languageId = 'statemachine';

const setup = async () => {
    const configure = () => {
        updateUserConfiguration(`{
    "editor.fontSize": 14,
    "workbench.colorTheme": "Default Dark+ Experimental"
}`);
        const extension = {
            name: 'langium-example',
            publisher: 'monaco-languageclient-project',
            version: '1.0.0',
            engines: {
                vscode: '*'
            },
            contributes: {
                languages: [{
                    id: languageId,
                    extensions: [
                        `.${languageId}`
                    ],
                    aliases: [
                        languageId
                    ],
                    configuration: './statemachine-configuration.json'
                }],
                grammars: [{
                    language: languageId,
                    scopeName: 'source.statemachine',
                    path: './statemachine-grammar.json'
                }],
                keybindings: [{
                    key: 'ctrl+p',
                    command: 'editor.action.quickCommand',
                    when: 'editorTextFocus'
                }, {
                    key: 'ctrl+shift+c',
                    command: 'editor.action.commentLine',
                    when: 'editorTextFocus'
                }]
            }
        };
        const { registerFile: registerExtensionFile } = registerExtension(extension);

        registerExtensionFile('/statemachine-configuration.json', async () => {
            const statemachineLanguageConfig = new URL('../../../node_modules/langium-statemachine-dsl/language-configuration.json', window.location.href).href;
            return (await fetch(statemachineLanguageConfig)).text();
        });

        registerExtensionFile('/statemachine-grammar.json', async () => {
            const statemachineTmUrl = new URL('../../../node_modules/langium-statemachine-dsl/syntaxes/statemachine.tmLanguage.json', window.location.href).href;
            return (await fetch(statemachineTmUrl)).text();
        });
    };

    await initServices({
        enableThemeService: true,
        enableTextmateService: true,
        enableConfigurationService: true,
        modelEditorServiceConfig: {
            useDefaultFunction: true
        },
        configurationServiceConfig: {
            defaultWorkspaceUri: monaco.Uri.file('/')
        },
        enableLanguagesService: true,
        userServices: { ...getKeybindingsServiceOverride() }
    }).then(() => configure());
};

const run = async () => {
    const exampleStatemachineUrl = new URL('./src/langium/example.statemachine', window.location.href).href;
    const responseStatemachine = await fetch(exampleStatemachineUrl);
    const editorText = await responseStatemachine.text();

    const editorOptions = {
        model: monaco.editor.createModel(editorText, languageId, monaco.Uri.parse('inmemory://example.statemachine')),
        automaticLayout: true
    };
    createConfiguredEditor(document.getElementById('container')!, editorOptions);

    function createLanguageClient(transports: MessageTransports): MonacoLanguageClient {
        return new MonacoLanguageClient({
            name: 'Langium Statemachine Client',
            clientOptions: {
                // use a language id as a document selector
                documentSelector: [{ language: languageId }],
                // disable the default error handler
                errorHandler: {
                    error: () => ({ action: ErrorAction.Continue }),
                    closed: () => ({ action: CloseAction.DoNotRestart })
                }
            },
            // create a language client connection to the server running in the web worker
            connectionProvider: {
                get: () => {
                    return Promise.resolve(transports);
                }
            }
        });
    }

    const langiumWorkerUrl = new URL('./dist/worker/statemachineServerWorker.js', window.location.href).href;
    const worker = new Worker(langiumWorkerUrl, {
        type: 'module',
        name: 'Statemachine LS'
    });
    const reader = new BrowserMessageReader(worker);
    const writer = new BrowserMessageWriter(worker);
    const languageClient = createLanguageClient({ reader, writer });
    languageClient.start();

    reader.onClose(() => languageClient.stop());
};

setup()
    .then(() => run())
    .catch((e: Error) => console.log(e));

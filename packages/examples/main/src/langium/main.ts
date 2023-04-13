/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
// support all editor features
import 'monaco-editor/esm/vs/editor/edcore.main.js';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { buildWorkerDefinition } from 'monaco-editor-workers';

import { MonacoLanguageClient } from 'monaco-languageclient';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver-protocol/browser.js';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient';

import { createConfiguredEditor } from 'vscode/monaco';
import { initialize as initializeMonacoService } from 'vscode/services';
import { initialize as initializeVscodeExtensions, registerExtension } from 'vscode/extensions';
import getModelEditorServiceOverride from 'vscode/service-override/modelEditor';
import getNotificationServiceOverride from 'vscode/service-override/notifications';
import getDialogsServiceOverride from 'vscode/service-override/dialogs';
import getConfigurationServiceOverride, { updateUserConfiguration } from 'vscode/service-override/configuration';
import getKeybindingsServiceOverride from 'vscode/service-override/keybindings';
import getTextmateServiceOverride from 'vscode/service-override/textmate';
import getLanguagesServiceOverride from 'vscode/service-override/languages';
import getThemeServiceOverride from 'vscode/service-override/theme';
import getAudioCueServiceOverride from 'vscode/service-override/audioCue';
import getPreferencesServiceOverride from 'vscode/service-override/preferences';
import 'vscode/default-extensions/theme-defaults';

buildWorkerDefinition('../../../node_modules/monaco-editor-workers/dist/workers/', new URL('', window.location.href).href, false);

const languageId = 'statemachine';

const setup = async () => {
    await initializeMonacoService({
        ...getModelEditorServiceOverride(async (model, options, sideBySide) => {
            console.log('Trying to open a model: ', model, options, sideBySide);
            return undefined;
        }),
        ...getNotificationServiceOverride(),
        ...getDialogsServiceOverride(),
        ...getConfigurationServiceOverride(monaco.Uri.file('/')),
        ...getKeybindingsServiceOverride(),
        ...getTextmateServiceOverride(),
        ...getThemeServiceOverride(),
        ...getLanguagesServiceOverride(),
        ...getAudioCueServiceOverride(),
        ...getPreferencesServiceOverride()
    })
        .then(() => console.log('initializeMonacoService completed successfully'))
        .catch((e) => console.error(`initializeMonacoService had errors: ${e}`));

    await initializeVscodeExtensions()
        .then(() => console.log('initializeVscodeExtensions completed successfully'))
        .catch((e) => console.error(`initializeVscodeExtensions had errors: ${e}`));

    updateUserConfiguration(`{
        "editor.fontSize": 14,
        "workbench.colorTheme": "Default Dark+"
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

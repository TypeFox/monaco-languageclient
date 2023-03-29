/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
// support all editor features
import 'monaco-editor/esm/vs/editor/editor.all.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickInput/standaloneQuickInputService.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast.js';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { buildWorkerDefinition } from 'monaco-editor-workers';

import { MonacoLanguageClient, MonacoServices } from 'monaco-languageclient';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver-protocol/browser.js';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient';

import { createConfiguredEditor } from 'vscode/monaco';
import { StandaloneServices } from 'vscode/services';
import getModelEditorServiceOverride from 'vscode/service-override/modelEditor';
import getNotificationServiceOverride from 'vscode/service-override/notifications';
import getDialogsServiceOverride from 'vscode/service-override/dialogs';
import getConfigurationServiceOverride, { updateUserConfiguration } from 'vscode/service-override/configuration';
import getKeybindingsServiceOverride from 'vscode/service-override/keybindings';
import { registerExtension } from 'vscode/extensions';
import getTextmateServiceOverride from 'vscode/service-override/textmate';
import getLanguagesServiceOverride from 'vscode/service-override/languages';
import getTokenClassificationServiceOverride from 'vscode/service-override/tokenClassification';
import getLanguageConfigurationServiceOverride from 'vscode/service-override/languageConfiguration';
import getThemeServiceOverride from 'vscode/service-override/theme';
import getAudioCueServiceOverride from 'vscode/service-override/audioCue';

buildWorkerDefinition('../../../node_modules/monaco-editor-workers/dist/workers/', new URL('', window.location.href).href, false);

const languageId = 'statemachine';
let editorText = '';

const setup = async () => {
    const statemachineLanguageConfig = new URL('../../../node_modules/langium-statemachine-dsl/language-configuration.json', window.location.href).href;
    const statemachineTmUrl = new URL('../../../node_modules/langium-statemachine-dsl/syntaxes/statemachine.tmLanguage.json', window.location.href).href;
    const exampleStatemachineUrl = new URL('./src/langium/example.statemachine', window.location.href).href;

    const responseStatemachine = await fetch(exampleStatemachineUrl);
    editorText = await responseStatemachine.text();

    StandaloneServices.initialize({
        ...getModelEditorServiceOverride(async (model, options) => {
            console.log('trying to open a model', model, options);
            return undefined;
        }),
        ...getNotificationServiceOverride(),
        ...getDialogsServiceOverride(),
        ...getConfigurationServiceOverride(),
        ...getKeybindingsServiceOverride(),
        ...getTextmateServiceOverride(),
        ...getThemeServiceOverride(),
        ...getTokenClassificationServiceOverride(),
        ...getLanguageConfigurationServiceOverride(),
        ...getLanguagesServiceOverride(),
        ...getAudioCueServiceOverride()
    });

    updateUserConfiguration(`{
        "editor.fontSize": 14
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
            }]
        }
    };
    const { registerFile: registerExtensionFile } = registerExtension(extension);

    registerExtensionFile('/java-configuration.json', async () => {
        return (await fetch(statemachineLanguageConfig)).text();
    });

    registerExtensionFile('/java-grammar.json', async () => {
        return (await fetch(statemachineTmUrl)).text();
    });
};

const run = async () => {
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

    // install Monaco language client services
    MonacoServices.install();

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

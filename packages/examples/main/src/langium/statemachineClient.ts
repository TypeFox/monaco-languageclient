/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import 'monaco-editor/esm/vs/editor/editor.all.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js';
import { editor, Uri } from 'monaco-editor/esm/vs/editor/editor.api.js';

import { MonacoLanguageClient, initServices } from 'monaco-languageclient';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver-protocol/browser.js';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient';
import { createConfiguredEditor } from 'vscode/monaco';
import { ExtensionHostKind, registerExtension } from 'vscode/extensions';
import { updateUserConfiguration } from 'vscode/service-override/configuration';
import getAccessibilityServiceOverride from 'vscode/service-override/accessibility';
import { LogLevel } from 'vscode/services';
// import { renderPanelPart } from 'vscode/service-override/views';
import 'vscode/default-extensions/theme-defaults';

import { buildWorkerDefinition } from 'monaco-editor-workers';
buildWorkerDefinition('../../../node_modules/monaco-editor-workers/dist/workers/', new URL('', window.location.href).href, false);

const languageId = 'statemachine';

const setup = async () => {
    console.log('Setting up Statemachine client configuration ...');
    const extension = {
        name: 'statemachine-client',
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
    const { registerFileUrl } = registerExtension(extension, ExtensionHostKind.LocalProcess);
    // const api = await getApi();

    registerFileUrl('/statemachine-configuration.json', new URL('../../../node_modules/langium-statemachine-dsl/language-configuration.json', window.location.href).href);
    registerFileUrl('/statemachine-grammar.json', new URL('../../../node_modules/langium-statemachine-dsl/syntaxes/statemachine.tmLanguage.json', window.location.href).href);

    updateUserConfiguration(`{
    "editor.fontSize": 14,
    "workbench.colorTheme": "Default Dark Modern"
}`);
};

const run = async () => {
    const exampleStatemachineUrl = new URL('./src/langium/example.statemachine', window.location.href).href;
    const editorText = await (await fetch(exampleStatemachineUrl)).text();

    const editorOptions = {
        model: editor.createModel(editorText, languageId, Uri.parse('inmemory://example.statemachine')),
        automaticLayout: true
    };
    createConfiguredEditor(document.getElementById('container')!, editorOptions);

    function createLanguageClient(transports: MessageTransports): MonacoLanguageClient {
        return new MonacoLanguageClient({
            name: 'Statemachine Client',
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

try {
    // use this to demonstrate all possible services made available by the monaco-vscode-api
    await initServices({
        enableThemeService: true,
        enableTextmateService: true,
        enableModelService: true,
        configureEditorOrViewsServiceConfig: {
            enableViewsService: false,
            useDefaultOpenEditorFunction: true
        },
        configureConfigurationServiceConfig: {
            defaultWorkspaceUri: '/tmp'
        },
        enableKeybindingsService: true,
        enableLanguagesService: true,
        enableAudioCueService: true,
        enableDebugService: true,
        enableDialogService: true,
        enableNotificationService: true,
        enablePreferencesService: true,
        enableSnippetsService: true,
        enableQuickaccessService: true,
        enableOutputService: true,
        enableSearchService: true,
        enableMarkersService: false,
        // don't enable files and extensions services. They will be enabled automatically
        enableFilesService: false,
        enableExtensionsService: false,
        enableLanguageDetectionWorkerService: true,
        // This should demonstrate that you can chose to not use the built-in loading mechanism,
        // but do it manually, see below
        enableAccessibilityService: false,
        userServices: {
            // manually add the accessibility service
            ...getAccessibilityServiceOverride()
        },
        debugLogging: true,
        logLevel: LogLevel.Info
    });
    // renderPanelPart(document.querySelector<HTMLDivElement>('#panel')!);
    await setup();
    await run();
} catch (e) {
    console.error(e);
}

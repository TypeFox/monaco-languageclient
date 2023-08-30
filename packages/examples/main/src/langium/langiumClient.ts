/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Uri } from 'monaco-editor';

import { MonacoLanguageClient, initServices } from 'monaco-languageclient';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver-protocol/browser.js';
import { CloseAction, ErrorAction } from 'vscode-languageclient';

import { createConfiguredEditor, createModelReference, IReference, ITextFileEditorModel } from 'vscode/monaco';
import { ExtensionHostKind, registerExtension } from 'vscode/extensions';
import { updateUserConfiguration } from 'vscode/service-override/configuration';
import { RegisteredFileSystemProvider, registerFileSystemOverlay, RegisteredMemoryFile } from 'vscode/service-override/files';
import 'vscode/default-extensions/theme-defaults';

import { buildWorkerDefinition } from 'monaco-editor-workers';
buildWorkerDefinition('../../../node_modules/monaco-editor-workers/dist/workers/', new URL('', window.location.href).href, false);

const languageId = 'langium';
let textModelRef: IReference<ITextFileEditorModel>;

export const setupLangiumClient = async () => {
    await initServices({
        // required for default themes
        enableThemeService: true,
        // required for textmate grammars
        enableTextmateService: true,
        // required for text model handling (here: /workspace/example.langium)
        enableModelService: true,
        // use editor mode
        configureEditorOrViewsService: {
        },
        // enable configuration services
        configureConfigurationService: {
            defaultWorkspaceUri: '/workspace'
        },
        // enable platform specific keybindings
        enableKeybindingsService: true,
        // enable language support
        enableLanguagesService: true,
        debugLogging: true
    });

    console.log('Setting up Langium client configuration ...');
    // define this client as vscode extension, required for textmate grammars
    const extension = {
        name: 'langium-client',
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
                // files are loaded below and bind below
                configuration: './langium-configuration.json'
            }],
            grammars: [{
                language: languageId,
                scopeName: 'source.langium',
                // files are loaded below and bind below
                path: './langium-grammar.json'
            }]
        }
    };
    const { registerFileUrl } = registerExtension(extension, ExtensionHostKind.LocalProcess);

    // these two files are taken from the langium-vscode
    // regiser the language configuration file url
    registerFileUrl('/langium-configuration.json', new URL('./src/langium/langium.configuration.json', window.location.href).href);
    // regiser the textmate grammar file url
    // using a textmate grammar requires the textmate and theme service to be enabled
    registerFileUrl('/langium-grammar.json', new URL('./src/langium/langium.tmLanguage.json', window.location.href).href);

    // set vscode configuration parameters
    updateUserConfiguration(`{
    "workbench.colorTheme": "Default Dark Modern"
}`);

    const exampleLangiumUrl = new URL('./src/langium/example.langium', window.location.href).href;
    const editorText = await (await fetch(exampleLangiumUrl)).text();

    // create and register a new file system provider
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    // register a file with content from the example.langium file loaded from src above
    fileSystemProvider.registerFile(new RegisteredMemoryFile(Uri.file('/workspace/example.langium'), editorText));
    registerFileSystemOverlay(1, fileSystemProvider);

    textModelRef = await createModelReference(Uri.file('/workspace/example.langium'));

    createConfiguredEditor(document.getElementById('container')!, {
        model: textModelRef.object.textEditorModel
    });

    // works only if browser supports module workers
    const langiumWorkerUrl = new URL('./src/langium/langiumServerWorker.ts', window.location.href).href;
    // use this if module workers aren't supported
    // const langiumWorkerUrl = new URL('./dist/worker/langiumServerWorker.js', window.location.href).href;
    const worker = new Worker(langiumWorkerUrl, {
        type: 'module',
        name: 'Langium LS'
    });
    const reader = new BrowserMessageReader(worker);
    const writer = new BrowserMessageWriter(worker);
    reader.onClose(() => languageClient.stop());

    const languageClient = new MonacoLanguageClient({
        name: 'Langium Client',
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
                return Promise.resolve({ reader, writer });
            }
        }
    });
    languageClient.start();

    // any further language client / server interaction can't be defined as needed
};

export const startLangiumClient = async () => {
    try {
        await setupLangiumClient();
    } catch (e) {
        console.log(e);
    }
};

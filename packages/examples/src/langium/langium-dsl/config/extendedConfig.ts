/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { InMemoryFileSystemProvider, registerFileSystemOverlay, type IFileWriteOptions } from '@codingame/monaco-vscode-files-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import type { EditorAppConfig } from 'monaco-languageclient/editorApp';
import type { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { type MonacoVscodeApiConfig, type OverallConfigType } from 'monaco-languageclient/vscodeApiWrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';
import langiumGrammarLangium from '../../../../resources/langium/langium-dsl/langium-grammar.langium?raw';
import langiumTypesLangium from '../../../../resources/langium/langium-dsl/langium-types.langium?raw';
import type { ExampleAppConfig } from '../../../common/client/utils.js';
import workerUrl from '../worker/langium-server?worker&url';
import langiumLanguageConfig from './langium.configuration.json?raw';
import langiumTextmateGrammar from './langium.tmLanguage.json?raw';

export const setupLangiumClientExtended = async (): Promise<ExampleAppConfig> => {
    const overallConfigType: OverallConfigType = 'extended';
    const extensionFilesOrContents = new Map<string, string | URL>();
    // vite build is easier with string content
    extensionFilesOrContents.set('/workspace/langium-configuration.json', langiumLanguageConfig);
    extensionFilesOrContents.set('/workspace/langium-grammar.json', langiumTextmateGrammar);

    const loadLangiumWorker = () => {
        console.log(`Langium worker URL: ${workerUrl}`);
        return new Worker(workerUrl, {
            type: 'module',
            name: 'Langium LS',
        });
    };

    const worker = loadLangiumWorker();
    const reader = new BrowserMessageReader(worker);
    const writer = new BrowserMessageWriter(worker);
    reader.listen((message) => {
        console.log('Received message from worker:', message);
    });

    // prepare all resources that should be preloaded
    const workspaceUri = vscode.Uri.file('/workspace');
    const langiumGrammarLangiumUri = vscode.Uri.file('/workspace/langium-grammar.langium');
    const langiumTypesLangiumUri = vscode.Uri.file('/workspace/langium-types.langium');
    const fileSystemProvider = new InMemoryFileSystemProvider();
    const textEncoder = new TextEncoder();

    const options: IFileWriteOptions = {
        atomic: false,
        unlock: false,
        create: true,
        overwrite: true
    };
    await fileSystemProvider.mkdir(workspaceUri);
    await fileSystemProvider.writeFile(langiumGrammarLangiumUri, textEncoder.encode(langiumGrammarLangium), options);
    await fileSystemProvider.writeFile(langiumTypesLangiumUri, textEncoder.encode(langiumTypesLangium), options);
    registerFileSystemOverlay(1, fileSystemProvider);

    const editorAppConfig: EditorAppConfig = {};

    const innerHtml = `<div id="editorsDiv">
    <div id="editors"></div>
</div>`;
    const viewsInit = async () => {
        const { Parts, onPartVisibilityChange, isPartVisibile, attachPart, } = await import('@codingame/monaco-vscode-views-service-override');

        for (const config of [
            { part: Parts.EDITOR_PART, element: '#editors' },
        ]) {
            attachPart(config.part, document.querySelector<HTMLDivElement>(config.element)!);

            if (!isPartVisibile(config.part)) {
                document.querySelector<HTMLDivElement>(config.element)!.style.display = 'none';
            }

            onPartVisibilityChange(config.part, visible => {
                document.querySelector<HTMLDivElement>(config.element)!.style.display = visible ? 'block' : 'none';
            });
        }
    };
    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: overallConfigType,
        logLevel: LogLevel.Debug,
        serviceOverrides: {
            ...getKeybindingsServiceOverride()
        },
        viewsConfig: {
            $type: 'ViewsService',
            htmlContainer: document.body,
            htmlAugmentationInstructions: (htmlElement: HTMLElement | null | undefined) => {
                const htmlContainer = document.createElement('div', { is: 'app' });
                htmlContainer.innerHTML = innerHtml;
                htmlElement?.append(htmlContainer);
            },
            viewsInitFunc: viewsInit
        },
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern',
                'editor.guides.bracketPairsHorizontal': 'active',
                'editor.wordBasedSuggestions': 'off',
                'editor.experimental.asyncTokenization': true,
                'vitest.disableWorkspaceWarning': true
            })
        },
        monacoWorkerFactory: configureDefaultWorkerFactory,
        extensions: [{
            config: {
                name: 'langium-example',
                publisher: 'TypeFox',
                version: '1.0.0',
                engines: {
                    vscode: '*'
                },
                contributes: {
                    languages: [{
                        id: 'langium',
                        extensions: ['.langium'],
                        aliases: ['langium', 'LANGIUM'],
                        configuration: '/workspace/langium-configuration.json'
                    }],
                    grammars: [{
                        language: 'langium',
                        scopeName: 'source.langium',
                        path: '/workspace/langium-grammar.json'
                    }]
                }
            },
            filesOrContents: extensionFilesOrContents
        }]
    };

    const languageClientConfig: LanguageClientConfig = {
        clientOptions: {
            documentSelector: ['langium']
        },
        connection: {
            options: {
                $type: 'WorkerDirect',
                worker
            },
            messageTransports: { reader, writer }
        }
    };

    return {
        editorAppConfig,
        vscodeApiConfig,
        languageClientConfig
    };
};

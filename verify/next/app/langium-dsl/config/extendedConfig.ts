/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { IFileWriteOptions } from '@codingame/monaco-vscode-files-service-override';
import type { ExampleAppConfig } from 'monaco-languageclient-examples';
import type { EditorAppConfig } from 'monaco-languageclient/editorApp';
import type { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import type { MonacoVscodeApiConfig, OverallConfigType } from 'monaco-languageclient/vscodeApiWrapper';

export const setupLangiumClientExtended = async (): Promise<ExampleAppConfig> => {

    // perform all imports dynamically
    const getKeybindingsServiceOverride = (await import('@codingame/monaco-vscode-keybindings-service-override')).default;
    const { InMemoryFileSystemProvider, registerFileSystemOverlay } = (await import('@codingame/monaco-vscode-files-service-override'));
    const { LogLevel } = (await import('@codingame/monaco-vscode-api'));
    const { Uri } = (await import('vscode'));
    const { configureDefaultWorkerFactory } = (await import('monaco-languageclient/workerFactory'));
    const { BrowserMessageReader, BrowserMessageWriter } = (await import('vscode-languageclient/browser.js'));

    // base configurration
    const overallConfigType: OverallConfigType = 'extended';
    const langiumLanguageConfigResponse = await fetch(new URL('./langium.configuration.json', import.meta.url));
    const langiumLanguageConfig = await langiumLanguageConfigResponse.text();
    const langiumTextmateGrammarResponse = await fetch(new URL('./langium.tmLanguage.json', import.meta.url));
    const langiumTextmateGrammar = await langiumTextmateGrammarResponse.text();

    const extensionFilesOrContents = new Map<string, string | URL>();
    extensionFilesOrContents.set('/workspace/langium-configuration.json', langiumLanguageConfig);
    extensionFilesOrContents.set('/workspace/langium-grammar.json', langiumTextmateGrammar);

    // prepare all resources that should be preloaded
    const exampleLangiumResponse = await fetch(new URL('./langium-grammar.langium', import.meta.url));
    const exampleLangium = await exampleLangiumResponse.text();
    const langiumTypesResponse = await fetch(new URL('./langium-types.langium', import.meta.url));
    const langiumTypesLangium = await langiumTypesResponse.text();

    const workspaceUri = Uri.file('/workspace');
    const langiumGrammarLangiumUri = Uri.file('/workspace/langium-grammar.langium');
    const langiumTypesLangiumUri = Uri.file('/workspace/langium-types.langium');
    const fileSystemProvider = new InMemoryFileSystemProvider();
    const textEncoder = new TextEncoder();

    const options: IFileWriteOptions = {
        atomic: false,
        unlock: false,
        create: true,
        overwrite: true
    };
    await fileSystemProvider.mkdir(workspaceUri);
    await fileSystemProvider.writeFile(langiumGrammarLangiumUri, textEncoder.encode(exampleLangium), options);
    await fileSystemProvider.writeFile(langiumTypesLangiumUri, textEncoder.encode(langiumTypesLangium), options);
    registerFileSystemOverlay(1, fileSystemProvider);

    const editorAppConfig: EditorAppConfig = {};

    const workerFile = '/workers/langium-server.js';
    const worker = new Worker(workerFile, {
        type: 'module',
        name: 'Langium LS',
    });
    const reader = new BrowserMessageReader(worker);
    const writer = new BrowserMessageWriter(worker);

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
            htmlContainer: document.getElementById('monaco-editor-root')!,
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
        languageId: 'langium',
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

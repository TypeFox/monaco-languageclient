/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import type { EditorAppConfig } from 'monaco-languageclient/editorApp';
import type { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import type { MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver-protocol/browser';
import type { ExampleAppConfig } from '../../../../common/client/utils.js';
import minilogoLanguageConfig from './minilogo.configuration.json?raw';
import minilogoTextmateGrammar from './minilogo.tmLanguage.json?raw';

// sample MiniLogo content for the editor
const sampleContent = `// MiniLogo: draw a simple house

def square(size) {
    for i = 1 to 4 {
        move(size, 0)
        move(0, size)
    }
}

def triangle(size) {
    move(size, 0)
    move(-size / 2, size)
    move(-size / 2, -size)
}

// draw the house body
move(150, 100)
pen(down)
color(#654321)
square(100)
pen(up)

// draw the roof
move(150, 200)
pen(down)
color(#CC0000)
triangle(100)
pen(up)
`;

export const createMinilogoConfig = (params: { htmlContainer: HTMLElement }): ExampleAppConfig => {
    const languageId = 'minilogo';

    // create the worker from the langium-minilogo package's pre-built language server bundle
    const worker = new Worker(new URL('langium-minilogo/ls-web', import.meta.url), {
        type: 'module',
        name: 'MiniLogo Language Server'
    });
    const reader = new BrowserMessageReader(worker);
    const writer = new BrowserMessageWriter(worker);

    const languageClientConfig: LanguageClientConfig = {
        languageId,
        clientOptions: {
            documentSelector: [languageId]
        },
        connection: {
            options: {
                $type: 'WorkerDirect',
                worker
            },
            messageTransports: { reader, writer }
        }
    };

    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        viewsConfig: {
            $type: 'EditorService',
            htmlContainer: params.htmlContainer
        },
        logLevel: LogLevel.Debug,
        serviceOverrides: {
            ...getKeybindingsServiceOverride()
        },
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern',
                'editor.guides.bracketPairsHorizontal': 'active',
                'editor.wordBasedSuggestions': 'off',
                'editor.experimental.asyncTokenization': true
            })
        },
        monacoWorkerFactory: configureDefaultWorkerFactory,
        // register the minilogo language with textmate grammar for syntax highlighting
        extensions: [
            {
                config: {
                    name: 'minilogo-language',
                    publisher: 'TypeFox',
                    version: '1.0.0',
                    engines: { vscode: '*' },
                    contributes: {
                        languages: [
                            {
                                id: languageId,
                                extensions: ['.minilogo'],
                                aliases: ['MiniLogo', 'minilogo'],
                                configuration: '/workspace/minilogo-configuration.json'
                            }
                        ],
                        grammars: [
                            {
                                language: languageId,
                                scopeName: 'source.minilogo',
                                path: '/workspace/minilogo-grammar.json'
                            }
                        ]
                    }
                },
                filesOrContents: new Map<string, string | URL>([
                    ['/workspace/minilogo-configuration.json', minilogoLanguageConfig],
                    ['/workspace/minilogo-grammar.json', minilogoTextmateGrammar]
                ])
            }
        ]
    };

    const editorAppConfig: EditorAppConfig = {
        codeResources: {
            modified: {
                text: sampleContent,
                uri: '/workspace/example.minilogo'
            }
        }
    };

    return {
        editorAppConfig,
        vscodeApiConfig,
        languageClientConfig
    };
};

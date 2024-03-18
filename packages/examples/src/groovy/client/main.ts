/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
// this is required syntax highlighting
import '@codingame/monaco-vscode-groovy-default-extension';
import { disposeEditor, startEditor } from '../../common/example-apps-common.js';
import { UserConfig } from 'monaco-editor-wrapper';
import { groovyConfig } from '../config.js';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        basePath: '../../../node_modules'
    });
};

const code = `package test.org;
import java.io.File ;
File file = new File("E:/Example.txt");
`;

const userConfig: UserConfig = {
    wrapperConfig: {
        serviceConfig: {
            userServices: {
                ...getKeybindingsServiceOverride(),
            },
            debugLogging: true
        },
        editorAppConfig: {
            $type: 'extended',
            languageId: 'groovy',
            code,
            useDiffEditor: false,
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'Default Dark Modern',
                    'editor.guides.bracketPairsHorizontal': 'active'
                })
            }
        }
    },
    languageClientConfig: {
        options: {
            $type: 'WebSocketUrl',
            url: `ws://localhost:${groovyConfig.port}${groovyConfig.path}`
        }
    }
};

export const runGroovyClient = () => {
    try {
        const htmlElement = document.getElementById('monaco-editor-root');
        document.querySelector('#button-start')?.addEventListener('click', () => {
            startEditor(userConfig, htmlElement, code);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await disposeEditor(userConfig.wrapperConfig.editorAppConfig.useDiffEditor);
        });
    } catch (e) {
        console.error(e);
    }
};

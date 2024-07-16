/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import { createLangiumGlobalConfig } from './config/wrapperStatemachineConfig.js';
import { loadStatemachineWorkerRegular } from './main.js';
import text from './content/example.statemachine?raw';

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        ignoreMapping: true,
        workerLoaders: {
            editorWorkerService: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
        }
    });
};

export const runStatemachineReact = async () => {
    try {
        const langiumGlobalConfig = await createLangiumGlobalConfig({
            languageServerId: 'react',
            useLanguageClient: true,
            text,
            worker: loadStatemachineWorkerRegular()
        });
        const styles = {
            'paddingTop': '5px',
            'height': '80vh'
        };
        const comp = <MonacoEditorReactComp
            userConfig={langiumGlobalConfig}
            style={styles}
        />;

        const htmlElement = document.getElementById('monaco-editor-root');
        ReactDOM.createRoot(htmlElement!).render(comp);

        // container comp around MonacoEditorReactComp

        // app comp
        //   => MonacoEditorReactComp

        // use
        setTimeout(() => {
            console.log('Updating styles');
            styles.height = '85vh';
            if (langiumGlobalConfig.wrapperConfig.editorAppConfig.codeResources !== undefined) {
                if (langiumGlobalConfig.wrapperConfig.editorAppConfig.codeResources.main !== undefined) {
                    langiumGlobalConfig.wrapperConfig.editorAppConfig.codeResources.main.text = 'tester';
                }
            }
        }, 2000);
    } catch (e) {
        console.error(e);
    }
};

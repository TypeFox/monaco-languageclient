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
            text,
            worker: loadStatemachineWorkerRegular()
        });
        const comp = <MonacoEditorReactComp
            userConfig={langiumGlobalConfig}
            style={{
                'paddingTop': '5px',
                'height': '80vh'
            }}
        />;

        const htmlElement = document.getElementById('monaco-editor-root');
        ReactDOM.createRoot(htmlElement!).render(comp);
    } catch (e) {
        console.error(e);
    }
};

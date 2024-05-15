/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import { getTextContent } from '../../common/client/app-utils.js';
import { createLangiumGlobalConfig } from './config/wrapperStatemachineConfig.js';
import { loadStatemachineWorkerRegular } from './main.js';

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        basePath: '../../../node_modules'
    });
};

export const runStatemachineReact = async () => {
    try {
        const text = await getTextContent(new URL('./src/langium/statemachine/content/example.statemachine', window.location.href));
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

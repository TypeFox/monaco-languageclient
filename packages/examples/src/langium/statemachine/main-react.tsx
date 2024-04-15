/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { createLangiumGlobalConfig } from './config/wrapperStatemachineConfig.js';
import { loadStatemachineWorkerRegular } from './main.js';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        basePath: '../../../node_modules'
    });
};

export const runStatemachineReact = async () => {
    try {
        const langiumGlobalConfig = await createLangiumGlobalConfig(loadStatemachineWorkerRegular());
        const comp = <MonacoEditorReactComp
            userConfig={langiumGlobalConfig}
            style={{
                'paddingTop': '5px',
                'height': '80vh'
            }}
        />;

        const htmlElement = document.getElementById('root');
        ReactDOM.createRoot(htmlElement!).render(comp);
    } catch (e) {
        console.error(e);
    }
};

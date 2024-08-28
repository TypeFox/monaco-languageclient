/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import React, { StrictMode, useEffect, useState } from 'react';
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
    const langiumGlobalConfig = await createLangiumGlobalConfig({
        languageServerId: 'react',
        useLanguageClient: true,
        text,
        worker: loadStatemachineWorkerRegular()
    });

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            const htmlElement = document.getElementById('monaco-editor-root');
            const App = () => {

                const [ height, setHeight ] = useState('80vh');

                useEffect(() => {
                    const timer = setTimeout(() => {
                        console.log('Updating styles');
                        setHeight('85vh');
                    }, 2000);

                    return () => clearTimeout(timer);
                }, []);

                return (
                    <div style={{ 'height': height }} >
                        <MonacoEditorReactComp
                            style={{ 'height': '100%' }}
                            userConfig={langiumGlobalConfig} />
                    </div>
                );
            };
            const strictMode = (document.getElementById('checkbox-strictmode')! as HTMLInputElement).checked;
            if (strictMode) {
                ReactDOM.createRoot(htmlElement!).render(<StrictMode><App /></StrictMode>);
            } else {
                ReactDOM.createRoot(htmlElement!).render(<App />);
            }
        });
        document.querySelector('#button-dispose')?.addEventListener('click', () => {

        });
    } catch (e) {
        console.error(e);
    }
};

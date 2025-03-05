/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import React, { StrictMode, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';
import type { TextContents } from 'monaco-editor-wrapper';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { createLangiumGlobalConfig } from './config/wrapperStatemachineConfig.js';
import { loadStatemachineWorkerRegular } from './main.js';
import text from '../../../resources/langium/statemachine/example.statemachine?raw';
import { disableElement } from '../../common/client/utils.js';

export const runStatemachineReact = async () => {
    const worker = loadStatemachineWorkerRegular();
    const reader = new BrowserMessageReader(worker);
    const writer = new BrowserMessageWriter(worker);
    reader.listen((message) => {
        console.log('Received message from worker:', message);
    });
    const wrapperConfig = createLangiumGlobalConfig({
        languageServerId: 'react',
        useLanguageClient: true,
        text,
        worker,
        messageTransports: { reader, writer },
        htmlContainer: document.getElementById('monaco-editor-root')!
    });
    const root = ReactDOM.createRoot(document.getElementById('react-root')!);

    const onTextChanged = (textChanges: TextContents) => {
        console.log(`text: ${textChanges.modified}\ntextOriginal: ${textChanges.original}`);
    };
    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            disableElement('button-start', true);
            disableElement('button-dispose', false);

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
                            wrapperConfig={wrapperConfig}
                            onTextChanged={onTextChanged} />
                    </div>
                );
            };
            const strictMode = (document.getElementById('checkbox-strictmode')! as HTMLInputElement).checked;
            if (strictMode) {
                root.render(<StrictMode><App /></StrictMode>);
            } else {
                root.render(<App />);
            }
            disableElement('checkbox-strictmode', true);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', () => {
            disableElement('button-start', false);
            disableElement('button-dispose', true);

            root.render([]);
        });
    } catch (e) {
        console.error(e);
    }
};

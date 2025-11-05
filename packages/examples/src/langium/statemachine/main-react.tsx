/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import React, { StrictMode, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';
import type { EditorAppConfig, TextContents } from 'monaco-languageclient/editorApp';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { createLangiumGlobalConfig } from './config/statemachineConfig.js';
import { loadStatemachineWorkerRegular } from './main.js';
import text from '../../../resources/langium/statemachine/example.statemachine?raw';
import { disableElement } from '../../common/client/utils.js';

export const runStatemachineReact = async (noControls: boolean) => {
    const worker = loadStatemachineWorkerRegular();
    const reader = new BrowserMessageReader(worker);
    const writer = new BrowserMessageWriter(worker);
    reader.listen((message) => {
        console.log('Received message from worker:', message);
    });

    const appConfig = createLangiumGlobalConfig({
        languageServerId: 'react',
        codeContent: {
            text,
            uri: '/workspace/example.statemachine'
        },
        worker,
        messageTransports: { reader, writer }
    });

    const root = ReactDOM.createRoot(document.getElementById('react-root')!);
    const App = () => {
        const [testState, setTestState] = useState<string>('');
        const [testStateButton, setTestStateButton] = useState<string>(text);

        const onTextChanged = (textChanges: TextContents) => {
            setTestState(textChanges.modified as string);
        };

        const editorAppConfig: EditorAppConfig = {
            codeResources: {
                modified: {
                    text,
                    uri: '/workspace/example.statemachine'
                }
            }
        };

        return (
            <>
                <div>
                    <button
                        style={{background: 'purple'}} onClick={() => setTestStateButton(testStateButton + '\n// comment')}
                    >Change Text</button>
                    <MonacoEditorReactComp
                        style={{ 'height': '50vh' }}
                        vscodeApiConfig={appConfig.vscodeApiConfig}
                        editorAppConfig={editorAppConfig}
                        languageClientConfig={appConfig.languageClientConfig}
                        onTextChanged={onTextChanged}
                        modifiedTextValue={testStateButton}
                    />
                    <b>Debug:</b><br />{testState}
                </div>
            </>
        );
    };

    const renderApp = () => {
        const elem = document.getElementById('checkbox-strictmode');
        const strictMode = elem === null ? false : (elem as HTMLInputElement).checked;
        if (strictMode) {
            root.render(<StrictMode><App /></StrictMode>);
        } else {
            root.render(<App />);
        }
    };

    try {
        if (noControls) {
            renderApp();
        } else {
            document.querySelector('#button-start')?.addEventListener('click', async () => {
                disableElement('button-start', true);
                disableElement('button-dispose', false);
                renderApp();
                disableElement('checkbox-strictmode', true);
            });
            document.querySelector('#button-dispose')?.addEventListener('click', () => {
                disableElement('button-start', false);
                disableElement('button-dispose', true);

                root.render([]);
            });
        }
    } catch (e) {
        console.error(e);
    }
};

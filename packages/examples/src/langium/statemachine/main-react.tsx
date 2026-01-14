/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import { ConsoleLogger } from '@codingame/monaco-vscode-log-service-override';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import type { TextContents } from 'monaco-languageclient/editorApp';
import React, { StrictMode, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';
import text from '../../../resources/langium/statemachine/example.statemachine?raw';
import { disableElement } from '../../common/client/utils.js';
import { createLangiumGlobalConfig } from './config/statemachineConfig.js';
import { loadStatemachineWorkerRegular } from './main.js';

export const runStatemachineReact = async (noControls: boolean) => {
    const worker = loadStatemachineWorkerRegular();
    const reader = new BrowserMessageReader(worker);
    const writer = new BrowserMessageWriter(worker);
    const logger = new ConsoleLogger(LogLevel.Off);
    reader.listen((message) => {
        logger.info('Received message from worker:', message);
    });

    const root = ReactDOM.createRoot(document.getElementById('react-root')!);
    const App = () => {
        const [codeState, setCodeState] = useState<string>(text);
        const [disposeLcState, setDisposeLcState] = useState<boolean | undefined>(undefined);
        const [triggerReprocessConfig, setTriggerReprocessConfig] = useState<number>(0);

        const onTextChanged = (textChanges: TextContents) => {
            if (textChanges.modified !== codeState) {
                setCodeState(textChanges.modified as string);
            }
        };

        const appConfig = createLangiumGlobalConfig({
            languageServerId: 'react',
            codeContent: {
                text: codeState,
                uri: '/workspace/example.statemachine'
            },
            worker,
            messageTransports: { reader, writer }
        });

        return (
            <>
                <div>
                    <button style={{background: 'purple'}} onClick={() => {
                        setCodeState(codeState + '\n// comment');
                        setTriggerReprocessConfig(triggerReprocessConfig + 1);
                    }}>Change Text</button>
                    <button style={{background: 'green'}} onClick={() => {
                        setTriggerReprocessConfig(triggerReprocessConfig + 1);
                    }}>Reprocess Config</button>
                    <button style={{background: 'orange'}} onClick={() => setDisposeLcState(!(disposeLcState ?? false))}>Flip Language Client</button>

                    <MonacoEditorReactComp
                        style={{ 'height': '50vh' }}
                        vscodeApiConfig={appConfig.vscodeApiConfig}
                        editorAppConfig={appConfig.editorAppConfig}
                        languageClientConfig={appConfig.languageClientConfig}
                        onTextChanged={onTextChanged}
                        logLevel={LogLevel.Debug}
                        triggerReprocessConfig={triggerReprocessConfig}
                        onConfigProcessed={() => console.log(' >>> config processed <<<')}
                        enforceLanguageClientDispose={disposeLcState}
                        onDisposeLanguageClient={() => console.log(' >>> language client disposed <<<')}
                    />
                    <b>Debug:</b><br />{codeState}
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

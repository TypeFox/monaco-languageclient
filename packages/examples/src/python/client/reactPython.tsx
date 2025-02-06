/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { MonacoEditorLanguageClientWrapper, type TextChanges } from 'monaco-editor-wrapper';
import { createWrapperConfig  } from './config.js';
import { disableElement } from '../../common/client/utils.js';

export const runPythonReact = async () => {
    const appConfig = createWrapperConfig();
    
    const onTextChanged = (textChanges: TextContents) => {
        console.log(`text: ${textChanges.modified}\ntextOriginal: ${textChanges.original}`);
    };

    const root = ReactDOM.createRoot(document.getElementById('react-root')!);

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            const App = () => {
                return (
                    <div style={{ 'backgroundColor': '#1f1f1f' }} >
                        <MonacoEditorReactComp
                            wrapperConfig={appConfig.wrapperConfig}
                            style={{ 'height': '100%' }}
                            onTextChanged={onTextChanged}
                            onLoad={async (wrapper: MonacoEditorLanguageClientWrapper) => {
                                console.log(`Loaded ${wrapper.reportStatus().join('\n').toString()}`);

                                await vscode.commands.executeCommand('workbench.view.explorer');
                            }}
                            onError={(e) => {
                                console.error(e);
                            }} />
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
            root.render([]);
        });
    } catch (e) {
        console.error(e);
    }
};

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { configure } from './config.js';
import { configurePostStart } from './common.js';
import { disableElement } from '../common/client/utils.js';

export const runApplicationPlaygroundReact = async () => {

    const configResult = configure();
    const root = ReactDOM.createRoot(document.getElementById('react-root')!);

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            const App = () => {
                return (
                    <div style={{ 'backgroundColor': '#1f1f1f' }}>
                        <MonacoEditorReactComp
                            wrapperConfig={configResult.wrapperConfig}
                            onLoad={async (wrapper: MonacoEditorLanguageClientWrapper) => {
                                await configurePostStart(wrapper, configResult);
                            }}
                            onError={(e) => {
                                console.error(e);
                            }} />
                    </div>
                );
            };

            const checkElem = document.getElementById('checkbox-strictmode') as HTMLInputElement | null;
            const strictMode = checkElem?.checked;
            if (strictMode === true) {
                root.render(<StrictMode><App /></StrictMode>);
            } else {
                root.render(<App />);
            }
            disableElement('checkbox-strictmode', true);
        });
    } catch (e) {
        console.error(e);
    }
};

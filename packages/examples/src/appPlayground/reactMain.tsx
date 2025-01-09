/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { MonacoEditorLanguageClientWrapper, TextChanges } from 'monaco-editor-wrapper';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { configure } from './config.js';
import { configurePostStart } from './common.js';

export const runApplicationPlaygroundReact = async () => {

    const onTextChanged = (textChanges: TextChanges) => {
        console.log(`Dirty? ${textChanges.isDirty}\ntext: ${textChanges.modified}\ntextOriginal: ${textChanges.original}`);
    };
    const configResult = configure();
    const root = ReactDOM.createRoot(document.getElementById('react-root')!);

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            const App = () => {
                return (
                    <div style={{ 'backgroundColor': '#1f1f1f' }}>
                        <MonacoEditorReactComp
                            wrapperConfig={configResult.wrapperConfig}
                            onTextChanged={onTextChanged}
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
        });
    } catch (e) {
        console.error(e);
    }
};

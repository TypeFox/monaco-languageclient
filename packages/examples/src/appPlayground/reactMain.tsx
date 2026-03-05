/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { configurePostStart } from './common.js';
import { configure } from './config.js';

export const runApplicationPlaygroundReact = async () => {
    const configResult = await configure(document.body);
    const root = ReactDOM.createRoot(document.getElementById('react-root')!);
    const App = () => {
        return (
            <div style={{ backgroundColor: '#1f1f1f' }}>
                <MonacoEditorReactComp
                    vscodeApiConfig={configResult.vscodeApiConfig}
                    onVscodeApiInitDone={async (apiWrapper) => {
                        await configurePostStart(apiWrapper, configResult);
                    }}
                    onError={(e) => {
                        console.error(e);
                    }}
                />
            </div>
        );
    };
    root.render(<App />);
};

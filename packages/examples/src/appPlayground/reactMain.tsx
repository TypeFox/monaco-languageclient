/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { configure } from './config.js';
import { configurePostStart } from './common.js';

export const runApplicationPlaygroundReact = async () => {

    const configResult = await configure();
    const root = ReactDOM.createRoot(document.getElementById('react-root')!);
    const App = () => {
        return (
            <div style={{ 'backgroundColor': '#1f1f1f' }}>
                <MonacoEditorReactComp
                    vscodeApiConfig={configResult.vscodeApiConfig}
                    editorAppConfig={configResult.editorAppConfig}
                    onVscodeApiInitDone={async (apiWrapper) => {
                        await configurePostStart(apiWrapper, configResult);
                    }}
                    onError={(e) => {
                        console.error(e);
                    }} />
            </div>
        );
    };
    root.render(<App />);
};

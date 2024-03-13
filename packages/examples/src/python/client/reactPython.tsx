/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { createUserConfig } from './config.js';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        basePath: '../../../node_modules'
    });
};

export const runPythonReact = () => {
    /**
     * Code is intentionally incorrect - language server will pick this up on connection and highlight the error
     */
    const code = `def main():
        return pass`;

    const onTextChanged = (text: string, isDirty: boolean) => {
        console.log(`Dirty? ${isDirty} Content: ${text}`);
    };

    const comp = <MonacoEditorReactComp
        userConfig={createUserConfig(code)}
        style={{
            'paddingTop': '5px',
            'height': '80vh'
        }}
        onTextChanged={onTextChanged}
        onLoad={() => {
            console.log('Loaded');
        }}
        onError={(e) => {
            console.error(e);
        }}
    />;

    const root = ReactDOM.createRoot(document.getElementById('root')!);
    root.render(comp);
};

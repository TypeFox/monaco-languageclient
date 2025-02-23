/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { createWrapperConfig } from './config.js';
import helloPyCode from '../../../resources/python/hello.py?raw';
import hello2PyCode from '../../../resources/python/hello2.py?raw';
import badPyCode from '../../../resources/python/bad.py?raw';
import type { Files } from '../../debugger/common/serverSyncingFileSystemProvider.js';

const files: Files = {
    'main.py': {
        updated: Date.now(),
        text: helloPyCode,
    },
    'hello2.py': {
        updated: Date.now(),
        text: hello2PyCode,
    },
    'bad.py': { updated: Date.now(), text: badPyCode },
};

export const runPythonReact = async () => {
    const appConfig = createWrapperConfig({
        files,
        onFileUpdate: (file) => {
            console.error('[FILE] file updated', file);
            return Promise.resolve();
        },
        onFileDelete: (path) => {
            console.error('[FILE] file deleted', path);
            return Promise.resolve();
        }
    });

    const root = ReactDOM.createRoot(document.getElementById('react-root')!);

    const App = () => {
        return (
            <div style={{ width: '100%', height: '100%', backgroundColor: '#1f1f1f' }}>
                <MonacoEditorReactComp
                    wrapperConfig={appConfig.wrapperConfig}
                    style={{ height: '100%' }}
                    onLoad={appConfig.onLoad}
                    onError={(e) => {
                        console.error(e);
                    }}
                />
            </div>
        );
    };
    root.render(<App />);
};

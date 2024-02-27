/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { createLangiumGlobalConfig } from './config/wrapperStatemachineConfig.js';
import { loadStatemachinWorkerRegular } from './main.js';

const startEditor = async () => {
    const langiumGlobalConfig = await createLangiumGlobalConfig(loadStatemachinWorkerRegular());
    const comp = <MonacoEditorReactComp
        userConfig={langiumGlobalConfig}
        style={{
            'paddingTop': '5px',
            'height': '80vh'
        }}
    />;

    const root = ReactDOM.createRoot(document.getElementById('root')!);
    root.render(comp);
};

try {
    startEditor();
} catch (e) {
    console.error(e);
}

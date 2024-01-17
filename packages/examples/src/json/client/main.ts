/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { createDefaultJsonContent, createJsonEditor, createUrl, createWebSocketAndStartClient, performInit } from '../../common/client-commons.js';
import { buildWorkerDefinition } from 'monaco-editor-workers';
buildWorkerDefinition('../../node_modules/monaco-editor-workers/dist/workers/', new URL('', window.location.href).href, false);

export const startJsonClient = async () => {
    // use the same common method to create a monaco editor for json
    await performInit(true);
    await createJsonEditor({
        htmlElement: document.getElementById('container')!,
        content: createDefaultJsonContent()
    });

    const url = createUrl('localhost', 30000, '/sampleServer');
    createWebSocketAndStartClient(url);
};

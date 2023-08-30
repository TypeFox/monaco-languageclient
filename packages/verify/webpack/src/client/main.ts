/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { createDefaultJsonContent, createJsonEditor, createUrl, createWebSocketAndStartClient, performInit } from 'monaco-languageclient-examples';
import { buildWorkerDefinition } from 'monaco-editor-workers';
buildWorkerDefinition('dist/client/workers', new URL('', window.location.href).href, false);

const start = async () => {
    // use the same common method to create a monaco editor for json
    await performInit(true);
    await createJsonEditor({
        htmlElement: document.getElementById('container')!,
        content: createDefaultJsonContent()
    });

    // create the web socket
    const url = createUrl('localhost', 3000, '/sampleServer');
    createWebSocketAndStartClient(url);
};

start();

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { createMonacoEditor, createUrl, doInit, initWebSocketAndStartClient } from '../../common/client-commons.js';
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

/** backwards compatible wrapper for legacy version, only support json as languageId */
export const createWebSocketAndStartClient = (url: string): WebSocket => {
    return initWebSocketAndStartClient(url, 'json');
};

export const createDefaultJsonContent = (): string => {
    return `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": "unix"
}`;
};

/* backwards compatible wrapper for legacy version, for json lang only */
export const performInit = async (vscodeApiInit: boolean) => {
    return doInit(vscodeApiInit, {
        id: 'json',
        extensions: ['.json', '.jsonc'],
        aliases: ['JSON', 'json'],
        mimetypes: ['application/json']
    });
};

export const createJsonEditor = async (config: {
    htmlElement: HTMLElement,
    content: string
}) => {
    return createMonacoEditor({
        htmlElement: config.htmlElement,
        content: config.content,
        languageId: 'json'
    });
};

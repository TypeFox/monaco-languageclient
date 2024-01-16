/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import '@codingame/monaco-vscode-groovy-default-extension'; // this is for the syntax highlighting
import { createMonacoEditor, createUrl, initWebSocketAndStartClient, doInit } from '../../common/client-commons.js';
import { buildWorkerDefinition } from 'monaco-editor-workers';
import { groovyConfig } from '../config.js';
buildWorkerDefinition('../../node_modules/monaco-editor-workers/dist/workers/', new URL('', window.location.href).href, false);
export const startGroovyClient = async () => {
    const languageId = 'groovy';
    await doInit(true, {
        id: languageId,
        extensions: ['.groovy'],
        aliases: [languageId],
        mimetypes: ['application/json']
    });
    await createMonacoEditor({
        htmlElement: document.getElementById('container')!,
        content: `
package test.org;
import java.io.File ;
File file =     new File("E:/Example.txt");
        `,
        languageId
    });

    const url = createUrl('localhost', groovyConfig.port, groovyConfig.path);
    initWebSocketAndStartClient(url, languageId);
};

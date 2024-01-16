/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import '@codingame/monaco-vscode-groovy-default-extension'; // this is for the syntax highlighting
import { runLanguageClient } from '../../common/client-commons.js';
import { buildWorkerDefinition } from 'monaco-editor-workers';
import { groovyConfig } from '../config.js';
buildWorkerDefinition('../../node_modules/monaco-editor-workers/dist/workers/', new URL('', window.location.href).href, false);
export const startGroovyClient = async () => {
    const languageId = 'groovy';
    runLanguageClient(
        {
            vscodeApiInit: true,
            serverPath: groovyConfig.path,
            serverPort: groovyConfig.port,
            registerConfig: {
                id: languageId,
                extensions: ['.groovy'],
                aliases: [languageId],
                mimetypes: ['application/json']
            },
            defaultContent:
`
package test.org;
import java.io.File ;
File file =     new File("E:/Example.txt");
`,
            htmlElementId: 'container',
            clientUrl: 'localhost'
        }
    );
};

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { runLanguageServer } from '../../common/language-server-runner.js';
import { resolve } from 'path';
import { LanguageCli } from '../../common/model.js';

export const runJsonServer = (baseDir: string, relativeDir: string) => {
    const processRunPath = resolve(baseDir, relativeDir);
    runLanguageServer({
        serverName: 'JSON',
        pathName: '/sampleServer',
        serverPort: 30000,
        runCommand: LanguageCli.node,
        runCommandArgs: [
            processRunPath,
            '--stdio'
        ],
        wsServerOptions: {
            noServer: true,
            perMessageDeflate: false
        }
    });
};

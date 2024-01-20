/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { runLanguageServer } from '../../common/language-server-runner.js';
import { resolve } from 'path';
import { groovyConfig } from '../config.js';
import { LanguageName } from '../../common/server-commons.js';

export const runGroovyLanguageServer = (baseDir: string, relativeDir: string) => {
    const processRunPath = resolve(baseDir, relativeDir);
    runLanguageServer({
        serverName: 'GROOVY',
        pathName: groovyConfig.path,
        serverPort: groovyConfig.port,
        runCommand: LanguageName.java,
        runCommandArgs: [
            '-jar',
            processRunPath
        ],
        wsServerOptions: {
            noServer: true,
            perMessageDeflate: false
        }
    });
};

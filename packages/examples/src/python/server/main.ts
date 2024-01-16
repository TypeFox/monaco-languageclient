/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { resolve } from 'path';
import { runLanguageServer } from '../../common/language-server-runner.js';
import { IncomingMessage } from 'http';

export const runPythonServer = (baseDir: string, relativeDir: string) => {
    const processRunPath = resolve(baseDir, relativeDir);
    runLanguageServer({
        serverName: 'PYRIGHT',
        pathName: '/pyright',
        serverPort: 30001,
        runCommand: 'node',
        runCommandArgs: [
            processRunPath,
            '--stdio'
        ],
        wsServerOptions: {
            noServer: true,
            perMessageDeflate: false,
            clientTracking: true,
            verifyClient: (
                clientInfo: { origin: string; secure: boolean; req: IncomingMessage },
                callback
            ) => {
                const parsedURL = new URL(`${clientInfo.origin}${clientInfo.req?.url ?? ''}`);
                const authToken = parsedURL.searchParams.get('authorization');
                if (authToken === 'UserAuth') {
                    // eslint-disable-next-line n/no-callback-literal
                    callback(true);
                } else {
                    // eslint-disable-next-line n/no-callback-literal
                    callback(false);
                }
            }
        }
    });
};

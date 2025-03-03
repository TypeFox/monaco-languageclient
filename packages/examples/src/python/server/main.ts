/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { resolve } from 'node:path';
import { IncomingMessage } from 'node:http';
import { runLanguageServer } from '../../common/node/language-server-runner.js';
import { LanguageName } from '../../common/node/server-commons.js';

const port = parseInt(process.env.PORT ?? '', 10) || 30001;

export const runPythonServer = (baseDir: string, relativeDir: string) => {
    const processRunPath = resolve(baseDir, relativeDir);
    runLanguageServer({
        serverName: 'PYRIGHT',
        pathName: '/pyright',
        serverPort: port,
        runCommand: LanguageName.node,
        runCommandArgs: [processRunPath, '--stdio', '--verbose'],
        spawnOptions: { shell: true },
        wsServerOptions: {
            noServer: true,
            perMessageDeflate: false,
            clientTracking: true,
            verifyClient: (
                clientInfo: {
                    origin: string;
                    secure: boolean;
                    req: IncomingMessage;
                },
                callback,
            ) => {
                const parsedURL = new URL(
                    `${clientInfo.origin}${clientInfo.req.url ?? ''}`,
                );
                const authToken = parsedURL.searchParams.get('authorization');
                if (authToken === 'UserAuth') {
                    callback(true);
                } else {
                    callback(false);
                }
            },
        },
        logMessages: true,
    });
};

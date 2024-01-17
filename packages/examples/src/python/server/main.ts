/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import express from 'express';
import { getLocalDirectory } from '../../utils/fs-utils.js';
import { upgradeWsServer } from '../../common/server-commons.js';

export const runPythonServer = (baseDir: string, relativeDir: string) => {
    process.on('uncaughtException', (err: any) => {
        console.error('Uncaught Exception: ', err.toString());
        if (err.stack) {
            console.error(err.stack);
        }
    });

    // create the express application
    const app = express();
    // server the static content, i.e. index.html
    const dir = getLocalDirectory(import.meta.url);
    app.use(express.static(dir));
    // start the server
    const server = app.listen(30001);
    // create the web socket
    const wss = new WebSocketServer({
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
    });
    upgradeWsServer({
        serverName: 'PYRIGHT',
        pathName: '/pyright',
        server,
        wss,
        baseDir,
        relativeDir
    });
};

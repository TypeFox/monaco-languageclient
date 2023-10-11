/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { WebSocketServer } from 'ws';
import { Server } from 'http';
import express from 'express';
import { getLocalDirectory } from '../../utils/fs-utils.js';
import { upgradeWsServer } from '../../common/server-commons.js';

export const runJsonServer = (baseDir: string, relativeDir: string) => {
    process.on('uncaughtException', function(err: any) {
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
    const server: Server = app.listen(30000);
    // create the web socket
    const wss = new WebSocketServer({
        noServer: true,
        perMessageDeflate: false
    });
    upgradeWsServer({
        serverName: 'JSON',
        pathName: '/sampleServer',
        server,
        wss,
        baseDir,
        relativeDir
    });
};

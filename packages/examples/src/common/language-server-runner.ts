/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as cp from 'child_process';
import { ServerOptions, WebSocketServer } from 'ws';
import { Server } from 'http';
import express from 'express';
import { getLocalDirectory } from '../utils/fs-utils.js';
import { upgradeWsServer } from './server-commons.js';

export interface LanguageServerRunConfig {
    serverName: string;
    pathName: string;
    serverPort: number;
    runCommand: string; // 'node', 'java' , etc.
    runCommandArgs: string[];
    wsServerOptions: ServerOptions,
    spawnOptions?: cp.SpawnOptions;
}

export const runLanguageServer = (
    languageServerRunConfig: LanguageServerRunConfig
) => {
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
    // start the http server
    const httpServer : Server = app.listen(languageServerRunConfig.serverPort);
    const wss = new WebSocketServer(languageServerRunConfig.wsServerOptions);
    // create the web socket
    upgradeWsServer(languageServerRunConfig, {
        server: httpServer,
        wss
    });
};

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { resolve } from 'node:path';
import cors from 'cors';

import { runLanguageServer } from '../../common/node/language-server-runner.js';
import { LanguageName } from '../../common/node/server-commons.js';
import express from 'express';
export const runJsonServer = (baseDir: string, relativeDir: string) => {
    const processRunPath = resolve(baseDir, relativeDir);
    runLanguageServer({
        serverName: 'JSON',
        pathName: '/sampleServer',
        serverPort: 30000,
        runCommand: LanguageName.node,
        runCommandArgs: [
            processRunPath,
            '--stdio'
        ],
        wsServerOptions: {
            noServer: true,
            perMessageDeflate: false
        }
    });

    startMockHttpServerForSavingCodeFromEditor();
};

export const startMockHttpServerForSavingCodeFromEditor = () => {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.post('/save-code', (req, res) => {
        const { code } = req.body;
        console.log('Received code:', code);
        res.json({ success: true, message: code});
    });

    const PORT = 3003;
    app.listen(PORT, () => {
        console.log(`JSON server running on port ${PORT}`);
    });
};

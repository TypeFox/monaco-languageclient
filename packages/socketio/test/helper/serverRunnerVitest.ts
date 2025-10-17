/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import { SocketIoServer } from 'vscode-socketio-jsonrpc/node';

const socketIoServer = new SocketIoServer({
    hostname: 'localhost',
    wsPort: 30101,
    corsPort: 20101,
    logLevel: LogLevel.Info
});
socketIoServer.start();

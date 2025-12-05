/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */
import { SocketIoServer } from 'vscode-socketio-jsonrpc/node';
import { runStatemachineLanguageServer } from './statemachine-server.js';

const socketIoServerStatemachineLs = new SocketIoServer({
    hostname: 'localhost',
    wsPort: 30003,
    corsPort: 20001,
    logLevel: 1,
    messageTransportHandler: runStatemachineLanguageServer
});
socketIoServerStatemachineLs.start();

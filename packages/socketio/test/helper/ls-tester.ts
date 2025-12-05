/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { Socket } from 'socket.io';
import { ConsoleLogger, linkMessageTransports, LogLevel } from 'vscode-socketio-jsonrpc';
import { SocketIoServer } from 'vscode-socketio-jsonrpc/node';
import type { CommandCallback, CommandStatus, LsCommandArgs } from './command-args.js';
import { runDummyLanguageServer } from './ls/dummy.js';
import { getLocalDirectory, runStatemachineLanguageServer } from 'monaco-languageclient-examples/node';
import { createServerProcess } from '../../src/node/external.js';
import { resolve } from 'node:path';

const logger = new ConsoleLogger(LogLevel.Debug);

const runCommanding = async () => {
    const socketIoServerDummyLs = new SocketIoServer({
        hostname: 'localhost',
        wsPort: 30102,
        corsPort: 20101,
        logLevel: 1,
        messageTransportHandler: runDummyLanguageServer
    });
    const socketIoServerStatemachineLs = new SocketIoServer({
        hostname: 'localhost',
        wsPort: 30103,
        corsPort: 20101,
        logLevel: 1,
        messageTransportHandler: runStatemachineLanguageServer
    });

    const baseDir = resolve(getLocalDirectory(import.meta.url));
    const relativeDir = '../../../examples/dist/langium/statemachine/node/statemachine-server.js';
    const processRunPath = resolve(baseDir, relativeDir);
    const messageTransports = createServerProcess('External Statemachine Language Server', 'node', [processRunPath, '--stdio']);
    if (messageTransports !== undefined) {
        const socketIoServerPassthrough = new SocketIoServer({
            hostname: 'localhost',
            wsPort: 30003,
            corsPort: 20001,
            logLevel: 1,
            messageTransportHandler: (myMessageTransports) => {
                linkMessageTransports(myMessageTransports, messageTransports, {
                    logger: logger
                });
            }
        });
        socketIoServerPassthrough.start();
    } else {
        logger.error('Unable to spawn local Language Server process.');
    }

    const commandHandler = (socket: Socket) => {
        let message: string;
        let status: CommandStatus;

        socket.on('ls:start', (commandArgs: LsCommandArgs, callback: CommandCallback) => {
            status = 'OK';
            message = 'Language server started.';
            if (commandArgs.ls === 'dummy') {
                if (!socketIoServerDummyLs.isStarted()) {
                    socketIoServerDummyLs.start();
                } else {
                    message = 'Language server was already started.';
                }
            } else if (commandArgs.ls === 'statemachine') {
                if (!socketIoServerStatemachineLs.isStarted()) {
                    socketIoServerStatemachineLs.start();
                } else {
                    message = 'Language server was already started.';
                }
            } else {
                status = 'ERROR';
                message = 'Unknown language server.';
            }

            logger.info(message);
            callback({
                status,
                message
            });
        });
        socket.on('ls:stop', async (commandArgs: LsCommandArgs, callback: CommandCallback) => {
            status = 'OK';
            let message = 'Language server was stopped.';
            if (commandArgs.ls === 'dummy') {
                await socketIoServerDummyLs.shutdown();
            } else if (commandArgs.ls === 'statemachine') {
                await socketIoServerStatemachineLs.shutdown();
            } else {
                status = 'ERROR';
                message = 'Unknown language server.';
            }

            logger.info(message);
            callback({
                status,
                message: message
            });
        });
    };

    const socketIoServerCommanding = new SocketIoServer({
        hostname: 'localhost',
        wsPort: 30200,
        corsPort: 20101,
        logLevel: LogLevel.Debug,
        socketHandler: commandHandler
    });
    socketIoServerCommanding.start();
};
runCommanding();

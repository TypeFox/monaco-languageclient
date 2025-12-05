/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as cp from 'node:child_process';
import { StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node.js';
import type { MessageTransports } from '../connection.js';

export const createServerProcess = (serverName: string, command: string, args?: string[], options?: cp.SpawnOptions): MessageTransports | undefined => {
    const serverProcess = cp.spawn(command, args ?? [], options ?? {});
    serverProcess.on('error', error =>
        console.error(`Launching ${serverName} Server failed: ${error}`)
    );
    if (serverProcess.stderr !== null) {
        serverProcess.stderr.on('data', data =>
            console.error(`${serverName} Server: ${data}`)
        );
    }
    serverProcess.stdout?.on('data', data =>
        console.info(`${serverName} Server: ${data}`)
    );
    const disposeMessageTransports = () => {
        messageTransports?.reader.dispose();
        messageTransports?.writer.dispose();
    };
    const messageTransports = createMessageTransports(serverProcess);
    serverProcess.on('exit', () => {
        disposeMessageTransports();
    });
    serverProcess.on('close', () => {
        disposeMessageTransports();
    });
    return messageTransports;
};

export const createMessageTransports = (process: cp.ChildProcess): MessageTransports | undefined => {
    if (process.stdout !== null && process.stdin !== null) {
        // return createStreamConnection(process.stdout, process.stdin, () => process.kill());
        const reader = new StreamMessageReader(process.stdout);
        const writer = new StreamMessageWriter(process.stdin);
        return { reader, writer };
    } else {
        return undefined;
    }
};

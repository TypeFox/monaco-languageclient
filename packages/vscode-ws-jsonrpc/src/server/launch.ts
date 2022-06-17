/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as net from 'net';
import * as stream from 'stream';
import * as cp from 'child_process';
import { StreamMessageReader, StreamMessageWriter, SocketMessageReader, SocketMessageWriter } from "vscode-jsonrpc";
import { IConnection, createConnection } from "./connection";
import { IWebSocket, WebSocketMessageReader, WebSocketMessageWriter, IWebSocketConnection } from '../socket';

export function createServerProcess(serverName: string, command: string, args?: string[], options?: cp.SpawnOptions): IConnection {
    const serverProcess = cp.spawn(command, args, options);
    serverProcess.on('error', error =>
        console.error(`Launching ${serverName} Server failed: ${error}`)
    );
    serverProcess.stderr.on('data', data =>
        console.error(`${serverName} Server: ${data}`)
    );
    return createProcessStreamConnection(serverProcess);
}

export function createWebSocketConnection(socket: IWebSocket): IWebSocketConnection {
    const reader = new WebSocketMessageReader(socket);
    const writer = new WebSocketMessageWriter(socket);
    return createConnection(reader, writer, () => socket.dispose(), { socket });
}

export function createProcessSocketConnection(process: cp.ChildProcess, outSocket: net.Socket, inSocket: net.Socket = outSocket): IConnection {
    return createSocketConnection(outSocket, inSocket, () => process.kill());
}

export function createSocketConnection(outSocket: net.Socket, inSocket: net.Socket, onDispose: () => void): IConnection {
    const reader = new SocketMessageReader(outSocket);
    const writer = new SocketMessageWriter(inSocket);
    return createConnection(reader, writer, onDispose);
}

export function createProcessStreamConnection(process: cp.ChildProcess): IConnection {
    return createStreamConnection(process.stdout, process.stdin, () => process.kill());
}

export function createStreamConnection(outStream: stream.Readable, inStream: stream.Writable, onDispose: () => void): IConnection {
    const reader = new StreamMessageReader(outStream);
    const writer = new StreamMessageWriter(inStream);
    return createConnection(reader, writer, onDispose);
}


/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as cp from 'node:child_process';
import * as net from 'node:net';
import * as stream from 'node:stream';
import { Disposable, Message, MessageReader, MessageWriter } from 'vscode-jsonrpc';
import { SocketMessageReader, SocketMessageWriter, StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node';
import { type IWebSocket, type IWebSocketConnection, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import { DisposableCollection } from '../common/disposable.js';
import type { IConnection } from '../common/types.js';

export function createServerProcess(
  serverName: string,
  command: string,
  args?: string[],
  options?: cp.SpawnOptions
): IConnection | undefined {
  const serverProcess = cp.spawn(command, args ?? [], options ?? {});
  serverProcess.on('error', (error) => console.error(`Launching ${serverName} Server failed: ${error}`));
  if (serverProcess.stderr !== null) {
    serverProcess.stderr.on('data', (data) => console.error(`${serverName} Server: ${data}`));
  }
  return createProcessStreamConnection(serverProcess);
}

export function createWebSocketConnection(socket: IWebSocket): IWebSocketConnection {
  const reader = new WebSocketMessageReader(socket);
  const writer = new WebSocketMessageWriter(socket);
  return createConnection(reader, writer, () => socket.dispose(), { socket });
}

export function createProcessSocketConnection(
  process: cp.ChildProcess,
  outSocket: net.Socket,
  inSocket: net.Socket = outSocket
): IConnection {
  return createSocketConnection(outSocket, inSocket, () => process.kill());
}

export function createSocketConnection(outSocket: net.Socket, inSocket: net.Socket, onDispose: () => void): IConnection {
  const reader = new SocketMessageReader(outSocket);
  const writer = new SocketMessageWriter(inSocket);
  return createConnection(reader, writer, onDispose);
}

export function createProcessStreamConnection(process: cp.ChildProcess): IConnection | undefined {
  if (process.stdout !== null && process.stdin !== null) {
    return createStreamConnection(process.stdout, process.stdin, () => process.kill());
  } else {
    return undefined;
  }
}

export function createStreamConnection(outStream: stream.Readable, inStream: stream.Writable, onDispose: () => void): IConnection {
  const reader = new StreamMessageReader(outStream);
  const writer = new StreamMessageWriter(inStream);
  return createConnection(reader, writer, onDispose);
}

export function forward(clientConnection: IConnection, serverConnection: IConnection, map?: (message: Message) => Message): void {
  clientConnection.forward(serverConnection, map);
  serverConnection.forward(clientConnection, map);
  clientConnection.onClose(() => serverConnection.dispose());
  serverConnection.onClose(() => clientConnection.dispose());
}

export function createConnection<T extends object>(
  reader: MessageReader,
  writer: MessageWriter,
  onDispose: () => void,
  extensions: T = {} as T
): IConnection & T {
  const disposeOnClose = new DisposableCollection();
  reader.onClose(() => disposeOnClose.dispose());
  writer.onClose(() => disposeOnClose.dispose());
  return {
    reader,
    writer,
    forward(to: IConnection, map: (message: Message) => Message = (message) => message): void {
      reader.listen(async (input) => {
        const output = map(input);
        await to.writer.write(output);
      });
    },
    onClose(callback: () => void): Disposable {
      return disposeOnClose.push(Disposable.create(callback));
    },
    dispose: () => onDispose(),
    ...extensions
  };
}

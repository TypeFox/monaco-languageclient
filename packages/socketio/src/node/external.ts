/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as cp from 'node:child_process';
import { StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node';
import { InitializeRequest, MessageReader, MessageWriter, Message, type InitializeParams } from 'vscode-languageserver-protocol';
import type { MessageTransports, LinkMessageTransportsConfig } from '../common/connection.js';

export const createServerProcess = (
  serverName: string,
  command: string,
  args?: string[],
  options?: cp.SpawnOptions
): MessageTransports | undefined => {
  const serverProcess = cp.spawn(command, args ?? [], options ?? {});
  serverProcess.on('error', (error) => console.error(`Launching ${serverName} Server failed: ${error}`));
  serverProcess.stderr?.on('data', (data) => console.error(`${serverName} Server: ${data}`));
  serverProcess.stdout?.on('data', (data) => console.info(`${serverName} Server: ${data}`));

  const messageTransports: MessageTransports | undefined =
    serverProcess.stdout !== null && serverProcess.stdin !== null
      ? { reader: new StreamMessageReader(serverProcess.stdout), writer: new StreamMessageWriter(serverProcess.stdin) }
      : undefined;

  const disposeMessageTransports = () => {
    messageTransports?.reader.dispose();
    messageTransports?.writer.dispose();
  };

  serverProcess.on('exit', () => {
    disposeMessageTransports();
  });
  serverProcess.on('close', () => {
    disposeMessageTransports();
  });

  return messageTransports;
};

const processMessage = (reader: MessageReader, writer: MessageWriter, linkConfig?: LinkMessageTransportsConfig): void => {
  reader.listen(async (message) => {
    let output = message;
    if (linkConfig !== undefined) {
      if (Message.isRequest(output)) {
        if (output.method === InitializeRequest.type.method) {
          const initializeParams = output.params as InitializeParams;
          initializeParams.processId = process.pid;
        }
        linkConfig.logger?.info(`Request: ${output.method}`);
        linkConfig.logger?.info(JSON.stringify(output.jsonrpc));

        output = linkConfig.requestMessageHandler?.(output) ?? output;
      } else if (Message.isResponse(output)) {
        const outputResult = output.result !== null ? JSON.stringify(output.result) : 'unknonwn';
        linkConfig.logger?.info(`Response: ${outputResult}`);
        linkConfig.logger?.info(JSON.stringify(output.jsonrpc));
        output = linkConfig.responseMessageHandler?.(output) ?? output;
      }
    }

    await writer.write(output);
  });
};

export const linkMessageTransports = (one: MessageTransports, two: MessageTransports, linkConfig?: LinkMessageTransportsConfig) => {
  processMessage(one.reader, two.writer, linkConfig);
  processMessage(two.reader, one.writer, linkConfig);
};

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ----------------------------------------------------------------------------------------- */

import {
  createMessageConnection as _createMessageConnection,
  ConnectionOptions,
  type Logger,
  type MessageConnection,
  MessageReader,
  MessageWriter,
  type RequestMessage,
  type ResponseMessage
} from 'vscode-jsonrpc';

export function createMessageConnection(
  reader: MessageReader,
  writer: MessageWriter,
  logger?: Logger,
  options?: ConnectionOptions
): MessageConnection {
  const connection = _createMessageConnection(reader, writer, logger, options);
  // TODO: is this still needed?
  connection.onClose(() => connection.dispose());
  return connection;
}

export type MessageTransports = {
  reader: MessageReader;
  writer: MessageWriter;
};

export interface LinkMessageTransportsConfig {
  requestMessageHandler?: (message: RequestMessage) => RequestMessage;
  responseMessageHandler?: (message: ResponseMessage) => ResponseMessage;
  logger?: Logger;
}

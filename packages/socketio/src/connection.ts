/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ----------------------------------------------------------------------------------------- */

import { createMessageConnection as _createMessageConnection, ConnectionOptions, type Logger, Message, type MessageConnection, MessageReader, MessageWriter, type RequestMessage, type ResponseMessage } from 'vscode-jsonrpc';
import { InitializeRequest, type InitializeParams } from 'vscode-languageserver-protocol';

export function createMessageConnection(reader: MessageReader, writer: MessageWriter, logger?: Logger, options?: ConnectionOptions): MessageConnection {
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
    logMessages?: boolean;
    requestMessageHandler?: (message: RequestMessage) => RequestMessage;
    responseMessageHandler?: (message: ResponseMessage) => ResponseMessage;
    logger?: Logger;
};

const logMessage = (logMessage: boolean, messagePrefix: string, message: Message, logger?: Logger): void => {
    if (logMessage) {
        logger?.info(messagePrefix);
        logger?.info(JSON.stringify(message.jsonrpc));
    }
};

const processMessage = (reader: MessageReader, writer: MessageWriter, linkConfig?: LinkMessageTransportsConfig): void => {
    reader.listen(message => {
        let output = message;
        if (linkConfig !== undefined) {
            if (Message.isRequest(output)) {
                if (output.method === InitializeRequest.type.method) {
                    const initializeParams = output.params as InitializeParams;
                    initializeParams.processId = process.pid;
                }
                logMessage(linkConfig.logMessages ?? false, `Request: ${output.method}`, output, linkConfig.logger);
                output = linkConfig.requestMessageHandler?.(output) ?? output;
            } else if (Message.isResponse(output)) {
                logMessage(linkConfig.logMessages ?? false, 'Response', output, linkConfig.logger);
                output = linkConfig.responseMessageHandler?.(output) ?? output;
            }
        }

        writer.write(output);
    });
};

export const linkMessageTransports = (one: MessageTransports, two: MessageTransports, linkConfig?: LinkMessageTransportsConfig) => {
    processMessage(one.reader, two.writer, linkConfig);
    processMessage(two.reader, one.writer, linkConfig);
};


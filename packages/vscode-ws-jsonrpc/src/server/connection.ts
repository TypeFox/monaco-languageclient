/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { MessageReader, MessageWriter, Disposable, Message } from 'vscode-jsonrpc';
import { DisposableCollection } from '../disposable.js';

export interface IConnection extends Disposable {
    readonly reader: MessageReader;
    readonly writer: MessageWriter;
    forward(to: IConnection, map?: (message: Message) => Message): void;
    onClose(callback: () => void): Disposable;
}

export function forward(clientConnection: IConnection, serverConnection: IConnection, map?: (message: Message) => Message): void {
    clientConnection.forward(serverConnection, map);
    serverConnection.forward(clientConnection, map);
    clientConnection.onClose(() => serverConnection.dispose());
    serverConnection.onClose(() => clientConnection.dispose());
}

export function createConnection<T extends object>(reader: MessageReader, writer: MessageWriter, onDispose: () => void,
    extensions: T = {} as T): IConnection & T {
    const disposeOnClose = new DisposableCollection();
    reader.onClose(() => disposeOnClose.dispose());
    writer.onClose(() => disposeOnClose.dispose());
    return {
        reader,
        writer,
        forward(to: IConnection, map: (message: Message) => Message = (message) => message): void {
            reader.listen(input => {
                const output = map(input);
                to.writer.write(output);
            });
        },
        onClose(callback: () => void): Disposable {
            return disposeOnClose.push(Disposable.create(callback));
        },
        dispose: () => onDispose(),
        ...extensions
    };
}

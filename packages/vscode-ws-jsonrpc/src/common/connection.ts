/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Disposable, Message, MessageReader, MessageWriter } from 'vscode-jsonrpc';
import { DisposableCollection } from './disposable.js';
import type { IConnection } from './types.js';

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

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { Commands, Disposable } from './services';

export class MonacoCommands implements Commands {

    public constructor(protected readonly commandRegistry: monaco.commands.ICommandRegistry) { }

    public registerCommand(command: string, callback: (...args: any[]) => any, thisArg?: any): Disposable {
        return this.commandRegistry.registerCommand(command, (accessor: monaco.instantiation.ServicesAccessor, ...args: any[]) => callback.call(thisArg, ...args))
    }
}

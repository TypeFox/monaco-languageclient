/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as monaco from 'monaco-editor-core';
import { Commands, Disposable } from './services';

export class MonacoCommands implements Commands {

    public constructor() { }

    public registerCommand(command: string, callback: (...args: any[]) => any, thisArg?: any): Disposable {
        return monaco.editor.registerCommand(command, (accessor: monaco.instantiation.ServicesAccessor, ...args: any[]) => callback.call(thisArg, ...args))
    }
}

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { Commands, Disposable } from 'vscode-base-languageclient/lib/services';

export class MonacoCommands implements Commands {

    public constructor(protected readonly editor: monaco.editor.IStandaloneCodeEditor) { }

    public registerCommand(command: string, callback: (...args: any[]) => any, thisArg?: any): Disposable {
        return this.editor._commandService.addCommand(command, {
            handler: (_accessor, ...args: any[]) => callback(...args)
        });
    }
}

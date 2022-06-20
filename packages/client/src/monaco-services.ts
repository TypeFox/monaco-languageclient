/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { MonacoWorkspace } from './monaco-workspace';
import { ConsoleWindow } from './console-window';
import { Services } from 'vscode/services';
import * as vscode from 'vscode';

export interface MonacoServices extends Services {
    workspace: MonacoWorkspace
    window: ConsoleWindow
}

export namespace MonacoServices {
    export interface Options {
        workspaceFolders?: vscode.WorkspaceFolder[]
        rootPath?: string
    }
    export type Provider = () => MonacoServices;
    export function create (options: Options = {}): MonacoServices {
        return {
            workspace: new MonacoWorkspace(options.workspaceFolders, options.rootPath),
            window: new ConsoleWindow()
        };
    }
    export function install (options: Options = {}): vscode.Disposable {
        const services = create(options);
        return Services.install(services);
    }
    export function get (): MonacoServices {
        return Services.get() as MonacoServices;
    }
}

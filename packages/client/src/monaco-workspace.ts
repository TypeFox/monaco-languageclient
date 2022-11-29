/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as vscode from 'vscode';
import { Workspace } from 'vscode/services';

export class MonacoWorkspace implements Workspace {
    // eslint-disable-next-line no-useless-constructor
    constructor(
        public readonly workspaceFolders?: vscode.WorkspaceFolder[],
        public readonly rootPath?: string | undefined
    ) {
    }
}

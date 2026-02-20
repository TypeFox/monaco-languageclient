/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { runJsonWrapper } from 'monaco-languageclient-examples/json-client';

console.log(vscode.workspace.name);
await runJsonWrapper();


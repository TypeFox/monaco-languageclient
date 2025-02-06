/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { Uri } from 'vscode';

export type FileDefinition = {
    path: string;
    code: string;
    uri: Uri;
}

export type InitMessage = {
    id: 'init',
    files: Record<string, FileDefinition>
    defaultFile: string;
};

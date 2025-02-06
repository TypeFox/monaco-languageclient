/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

export type FileDefinition = {
    path: string;
    code: string;
}

export type InitMessage = {
    id: 'init',
    files: Record<string, FileDefinition>
};

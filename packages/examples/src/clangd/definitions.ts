/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

export const HOME_DIR = '/home/web_user';
export const WORKSPACE_PATH = `${HOME_DIR}/workspace`;

export interface VolatileInput {
    ignoreSubDirectories?: string[];
    useDefaultGlob: boolean;
}

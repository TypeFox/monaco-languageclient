/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'node:path';
import * as url from 'node:url';

/**
 * Solves: __dirname is not defined in ES module scope
 */
export function getLocalDirectory() {
    const __filename = url.fileURLToPath(import.meta.url);
    return path.dirname(__filename);
}

export function getRootDirectory() {
    return path.resolve(getLocalDirectory(), '..');
}

export function getPathRelativeToRootDirectory(relativePath: string, pathToDelete?: string) {
    if (pathToDelete) {
        return path.resolve(getRootDirectory(), relativePath, pathToDelete);
    } else {
        return path.resolve(getRootDirectory(), relativePath);
    }
}

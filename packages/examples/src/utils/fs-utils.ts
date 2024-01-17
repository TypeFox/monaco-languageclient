/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Solves: __dirname is not defined in ES module scope
 */
export const getLocalDirectory = (referenceUrl: string | URL) => {
    const __filename = fileURLToPath(referenceUrl);
    return dirname(__filename);
};

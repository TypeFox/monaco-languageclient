/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { resolve } from 'path';
import { runPythonServer } from './main.js';
import { getLocalDirectory } from '../../utils/fs-utils.js';

const baseDir = resolve(getLocalDirectory(import.meta.url));
const relativeDir = '../../../../../node_modules/pyright/dist/pyright-langserver.js';
runPythonServer(baseDir, relativeDir);

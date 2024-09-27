/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
    path.resolve(__dirname, './vitest.config.ts')
]);

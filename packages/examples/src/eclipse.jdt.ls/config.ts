/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { ExampleLsConfig } from '../common/client/extendedClient.js';

export const eclipseJdtLsConfig: ExampleLsConfig = {
    port: 30003,
    path: '/jdtls',
    basePath: '/home/mlc/packages/examples/resources/eclipse.jdt.ls',
    documentSelector: 'java'
};

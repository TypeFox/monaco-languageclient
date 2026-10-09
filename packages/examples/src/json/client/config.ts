/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { ExampleLsConfig } from '../../common/client/extendedClient.js';

export const jsontLsConfig: ExampleLsConfig = {
  hostname: import.meta.env.VITE_HOSTNAME_LS,
  port: 30000,
  path: '/sampleServer',
  basePathClient: '/home/mlc/packages/examples/resources/json',
  languageId: 'json'
};

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { ExampleLsConfig } from '../common/client/extendedClient.js';

export const eclipseJdtLsConfig: ExampleLsConfig = {
  // the conditional is needed when the server is run with node
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  hostname: import.meta.env?.VITE_HOSTNAME_LS_CONTAINER === undefined ? 'localhost' : import.meta.env.VITE_HOSTNAME_LS_CONTAINER,
  port: 30003,
  path: '/jdtls',
  basePathClient: '/home/ubuntu/mlc/packages/examples/resources/eclipse.jdt.ls',
  basePathServer: '/home/ubuntu/mlc/packages/examples/resources/eclipse.jdt.ls/ls',
  languageId: 'java'
};

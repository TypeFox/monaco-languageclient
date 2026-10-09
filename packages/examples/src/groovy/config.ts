/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { ExampleLsConfig } from '../common/client/extendedClient.js';

export const groovyConfig: ExampleLsConfig = {
  hostname: import.meta.env.VITE_HOSTNAME_LS_CONTAINER,
  port: 30002,
  path: '/groovy',
  basePathServer: '/home/gradle/mlc/packages/examples/resources/groovy',
  languageId: 'groovy'
};

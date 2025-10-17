/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { playwright } from '@vitest/browser-playwright';
import { mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import externalViteConfig from './vite.config.js';

/// <reference lib="vitest/config" />

export const vitestConfig = {
  test: {
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      api: {
        port: 20101
      },
      instances: [
        {
          browser: 'chromium'
        }
      ]
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['packages/client', 'packages/vscode-ws-jsonrpc', 'packages/wrapper-react']
    },
    include: ['**/client/test/**/*', '**/wrapper-react/test/**/*', '**/socketio/test/**/*'],
    exclude: ['**/support/**/*', '**/__screenshots__/**/*', '**/verify/**/*'],
    tags: [{ name: 'worker', fileParallelism: false, timeout: 10000 }, { name: 'main' }]
  }
};

const definedVitestConfig = defineVitestConfig(vitestConfig);

export default mergeConfig(definedVitestConfig, externalViteConfig);

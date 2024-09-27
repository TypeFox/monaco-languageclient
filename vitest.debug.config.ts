/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import { definedViteConfig } from './vite.config.js';
import { vitestBaseConfig } from './vitest.config.js';

const vitestDebugConfig = vitestBaseConfig;
vitestDebugConfig.test.browser.name = 'chromium';
vitestDebugConfig.test.browser.provider = 'playwright';

const definedVitestDebugConfig = defineVitestConfig(vitestDebugConfig);

export default mergeConfig(definedVitestDebugConfig, definedViteConfig);

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import definedViteConfig from './vite.config.js';
import { vitestConfig } from './vitest.config.js';

/// <reference lib="vitest/config" />

export const vitestClassicConfig = {
    ...vitestConfig,
};
vitestClassicConfig.test.include = [
    '**/wrapper/test/editorApp-classic.test.ts',
    '**/wrapper/test/wrapper-classic.test.ts',
    '**/wrapper/test/workers/workerLoaders.test.ts'
];
vitestClassicConfig.test.testTimeout = 20000;
vitestClassicConfig.test.browser.api.port = 20102;

const definedVitestConfig = defineVitestConfig(vitestClassicConfig);

export default mergeConfig(definedVitestConfig, definedViteConfig);


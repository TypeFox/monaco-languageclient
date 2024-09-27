/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';
import { vitestConfig } from './vitest.config.js';

export default defineConfig(configEnv => {

    const vitestDebugConfig = vitestConfig;
    vitestDebugConfig.test!.browser!.name = 'chromium';
    vitestDebugConfig.test!.browser!.provider = 'playwright';

    console.log('vitestDebugConfig:', vitestDebugConfig);

    const mergedConfig = mergeConfig(
        viteConfig(configEnv),
        defineConfig(vitestDebugConfig)
    );

    return mergedConfig;

});

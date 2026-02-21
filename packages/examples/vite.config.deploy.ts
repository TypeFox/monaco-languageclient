/**
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 */

import { defineConfig } from 'vite';
import { buildBaseProductionConfig } from './vite.production.base.js';

export default defineConfig(({ command }) => {
    console.log(`Running: ${command}`);
    const productionConfig = buildBaseProductionConfig();
    productionConfig.base = 'https://typefox.dev/monaco-languageclient/';
    return productionConfig;
});


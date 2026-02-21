/**
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 */

import { defineConfig } from 'vite';
import { buildBaseProductionConfig } from './vite.production.base.js';

export default defineConfig(({ command }) => {
    console.log(`Running: ${command}`);
    const productionConfig = buildBaseProductionConfig();
    productionConfig.base = 'http://localhost:20002/';
    productionConfig.preview = {
        port: 20002,
        cors: {
            origin: '*'
        },
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp'
        }
    };
    return productionConfig;
});


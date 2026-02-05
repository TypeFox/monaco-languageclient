/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import path from 'node:path';
import { defineConfig } from 'vite';

const config = defineConfig({
    build: {
        assetsInlineLimit: 0,
        lib: {
            entry: path.resolve(__dirname, './app/langium-dsl/config/extendedConfig.ts'),
            name: 'extendedConfig',
            fileName: () => 'extendedConfig.js',
            formats: ['es'],
            cssFileName: 'extendedConfig'
        },
        copyPublicDir: false,
        rolldownOptions: {
            external: [
                'react',
                'react-dom'
            ],
            output: {
                entryFileNames: '[name].js',
                assetFileNames: '[name][extname]'
            }
        },
        outDir: path.resolve(__dirname, 'bundle/langium-dsl/config'),
        emptyOutDir: true
    }
});

export default config;

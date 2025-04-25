/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import path from 'node:path';
import { defineConfig } from 'vite';

const config = defineConfig({
    build: {
        target: 'ES2022',
        assetsInlineLimit: 0,
        lib: {
            entry: path.resolve(__dirname, './app/langium-dsl/worker/langium-server.ts'),
            name: 'lsworker',
            fileName: () => `langium-server.js`,
            formats: ['es']
        },
        outDir: path.resolve(__dirname, './public/workers'),
        copyPublicDir: false,
        emptyOutDir: false
    },
    worker: {
        rollupOptions: {
            external: [
                path.resolve(__dirname, './app/langium-dsl/worker/wasm/**/*'),
            ]
        },
        format: 'es',
    },
    esbuild: {
        minifySyntax: false,
    }
});

export default config;

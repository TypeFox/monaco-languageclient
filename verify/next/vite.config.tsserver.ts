/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import path from 'node:path';
import { defineConfig } from 'vite';

const config = defineConfig({
    optimizeDeps: {
        include: [
            'vscode/localExtensionHost'
        ]
    },
    build: {
        assetsInlineLimit: 0, // 1024 * 1024 * 128,
        lib: {
            entry: path.resolve(__dirname, './node_modules/@codingame/monaco-vscode-typescript-language-features-default-extension/index.js'),
            name: 'tsserver',
            fileName: () => 'tsserver.js',
            formats: ['es'],
            cssFileName: 'tsserver'
        },
        rolldownOptions: {
            output: {
                entryFileNames: '[name].js',
                assetFileNames: '[name][extname]',
                inlineDynamicImports: false
            }
        },
        outDir: path.resolve(__dirname, 'bundle/tsserver'),
        emptyOutDir: true
    }

});

export default config;

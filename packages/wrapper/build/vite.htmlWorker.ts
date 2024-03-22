/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import path from 'path';
import { defineConfig } from 'vite';

const config = defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, '../../../node_modules/@codingame/monaco-vscode-standalone-html-language-features/worker.js'),
            name: 'htmlWorker',
            fileName: (format) => `workers/htmlWorker-${format}.js`,
            formats: ['es']
        },
        outDir: 'dist',
        emptyOutDir: false
    }
});

export default config;

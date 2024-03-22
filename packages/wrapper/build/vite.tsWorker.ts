/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import path from 'path';
import { defineConfig } from 'vite';

const config = defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, '../../../node_modules/@codingame/monaco-vscode-standalone-typescript-language-features/worker.js'),
            name: 'tsWorker',
            fileName: (format) => `workers/tsWorker-${format}.js`,
            formats: ['es']
        },
        outDir: 'dist',
        emptyOutDir: false
    }
});

export default config;

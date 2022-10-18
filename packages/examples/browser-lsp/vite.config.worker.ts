/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import path from 'path';
import { defineConfig } from 'vite';

const config = defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, './src/serverWorker.ts'),
            name: 'serverWorker',
            fileName: (format) => `serverWorker-${format}.js`,
            formats: ['es']
        },
        outDir: 'dist',
        emptyOutDir: false
    }
});

export default config;

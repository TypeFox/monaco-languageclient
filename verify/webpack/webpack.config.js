/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

// solve: __dirname is not defined in ES module scope
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
    entry: resolve(__dirname, 'src', 'client', 'main.ts'),
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.ts?$/,
                use: ['ts-loader']
            }
        ]
    },
    experiments: {
        outputModule: true
    },
    output: {
        filename: 'main.js',
        path: resolve(__dirname, 'dist', 'client'),
        module: true,
        workerChunkLoading: 'import',
        environment: {
            dynamicImportInWorker: true
        }
    },
    target: 'web',
    resolve: {
        extensions: ['.ts', '.js', '.json', '.ttf']
    },
    mode: 'development',
    devtool: 'source-map'
};

export default config;

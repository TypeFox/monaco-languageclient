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
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
                include: [
                    resolve(__dirname, './node_modules/**/*')
                ]
            },
            {
                test: /\.(mp3|wasm|ttf)$/i,
                type: 'asset/resource'
            }
        ],
        // this is required for loading .wasm (and other) files. For context, see https://stackoverflow.com/a/75252098 and https://github.com/angular/angular-cli/issues/24617
        parser: {
            javascript: {
                url: true
            }
        }
    },
    resolve: {
        extensions: ['.ts', '.js', '.json', '.ttf']
    }
};

export default config;

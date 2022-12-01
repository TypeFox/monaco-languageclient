/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
const path = require('path');

module.exports = {
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
                include: [
                    path.resolve(__dirname, '../../../node_modules/monaco-editor')
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            path: path.resolve(__dirname, '../../../node_modules/path-browserify')
        }
    }
};

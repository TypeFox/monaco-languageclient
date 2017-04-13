const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const buildRoot = path.resolve(__dirname, "lib");
const monacoEditorPath = '../node_modules/monaco-editor-core/dev/vs';

module.exports = {
    entry: path.resolve(buildRoot, "main.js"),
    output: {
        filename: 'bundle.js',
        path: buildRoot
    },
    module: {
        noParse: /vscode-languageserver-types/
    },
    resolve: {
        extensions: ['.js'],
        alias: {
            'vs': path.resolve(buildRoot, monacoEditorPath)
        }
    },
    devtool: 'source-map',
    target: 'web',
    node: {
        fs: 'empty',
        child_process: 'empty',
        net: 'empty',
        crypto: 'empty'
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: monacoEditorPath,
                to: 'vs'
            }
        ])
    ]
}
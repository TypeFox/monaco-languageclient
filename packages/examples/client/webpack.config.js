const path = require('path');

module.exports = {
    entry: path.resolve(__dirname, 'src', 'client.ts'),
    module: {
        rules: [{
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        },
        {
            test: /\.ttf$/,
            use: ['file-loader']
        },
        {
            test: /\.ts?$/,
            use: ['ts-loader']
        },
        ]
    },
    experiments: {
        outputModule: true,
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'webpack', 'dist'),
        module: true
    },
    target: 'web',
    resolve: {
        extensions: ['.ts', '.js', '.json', '.ttf'],
        fallback: {
            fs: 'empty',
            child_process: 'empty',
            net: 'empty',
            crypto: 'empty',
            path: require.resolve("path-browserify")
        }
    },
    mode: process.env['NODE_ENV'] === 'production' ? 'production' : 'development'
};

/* eslint-disable header/header */
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            path: 'path-browserify'
        }
    },
    assetsInclude: ['**/*.wasm']
});

/* eslint-disable header/header */
import { defineConfig } from 'vite';

export default defineConfig({
    resolve: {
        alias: {
            path: 'path-browserify'
        }
    },
    assetsInclude: ['**/*.wasm']
});

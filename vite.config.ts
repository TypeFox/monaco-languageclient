/* eslint-disable header/header */
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                client: path.resolve(__dirname, '/packages/examples/main/client.html'),
                langiumLsp: path.resolve(__dirname, '/packages/examples/main/langium_wwls.html'),
                browser: path.resolve(__dirname, '/packages/examples/main/browser.html'),
                react: path.resolve(__dirname, '/packages/examples/main/react.html')
            }
        }
    },
    resolve: {
        alias: {
            path: 'path-browserify'
        }
    },
    server: {
        port: 8080,
        origin: 'http://localhost:8080'
    },
    assetsInclude: ['**/*.wasm']
});

/* eslint-disable header/header */
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(() => {
    const config = {
        build: {
            rollupOptions: {
                input: {
                    client: resolve(__dirname, 'packages/examples/main/client.html'),
                    langiumClient: resolve(__dirname, 'packages/examples/main/langium_client.html'),
                    statemachineClient: resolve(__dirname, 'packages/examples/main/statemachine_client.html'),
                    browser: resolve(__dirname, 'packages/examples/main/browser.html'),
                    react: resolve(__dirname, 'packages/examples/main/react.html')
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
    };
    return config;
});

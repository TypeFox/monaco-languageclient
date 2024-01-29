/* eslint-disable header/header */
import { defineConfig } from 'vite';
import * as path from 'path';
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';

export default defineConfig(() => {
    const config = {
        build: {
            target: 'esnext',
            rollupOptions: {
                input: {
                    client: path.resolve(__dirname, 'packages/examples/client.html'),
                    statemachineClient: path.resolve(__dirname, 'packages/examples/statemachine_client.html'),
                    browser: path.resolve(__dirname, 'packages/examples/browser.html'),
                    react: path.resolve(__dirname, 'packages/examples/react.html'),
                    python: path.resolve(__dirname, 'packages/examples/python.html')
                }
            }
        },
        resolve: {
            // not needed here, see https://github.com/TypeFox/monaco-languageclient#vite-dev-server-troubleshooting
            // dedupe: ['monaco-editor', 'vscode']
        },
        server: {
            origin: 'http://localhost:8080',
            port: 8080
        },
        optimizeDeps: {
            esbuildOptions: {
                plugins: [
                    importMetaUrlPlugin
                ]
            }
        },
        define: {
            rootDirectory: JSON.stringify(__dirname)
        }
    };
    return config;
});

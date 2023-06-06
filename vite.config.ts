/* eslint-disable header/header */
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(() => {
    const config = {
        build: {
            rollupOptions: {
                input: {
                    client: resolve(__dirname, 'packages/examples/main/client.html'),
                    langiumLsp: resolve(__dirname, 'packages/examples/main/langium_wwls.html'),
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
        assetsInclude: ['**/*.wasm'],
        optimizeDeps: [

            'monaco-editor',
            'vscode',
            'vscode/extensions',
            'vscode/services',
            'vscode/monaco',
            'vscode/service-override/model',
            'vscode/service-override/editor',
            'vscode/service-override/notifications',
            'vscode/service-override/dialogs',
            'vscode/service-override/configuration',
            'vscode/service-override/keybindings',
            'vscode/service-override/textmate',
            'vscode/service-override/theme',
            'vscode/service-override/languages',
            'vscode/service-override/audioCue',
            'vscode/service-override/views',
            'vscode/service-override/quickaccess',
            'vscode/service-override/debug',
            'vscode/service-override/preferences',
            'vscode/service-override/snippets',
            'vscode/service-override/files',
            'vscode/default-extensions/theme-defaults',
            'vscode/default-extensions/javascript',
            'vscode/default-extensions/typescript',
            'vscode/default-extensions/json'
        ]
    };
    return config;
});

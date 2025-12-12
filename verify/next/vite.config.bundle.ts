/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import path from 'node:path';
import { defineConfig } from 'vite';

const config = defineConfig({
    build: {
        assetsInlineLimit: 0,
        lib: {
            entry: path.resolve(__dirname, './app/langium-dsl/config/extendedConfig.ts'),
            name: 'extendedConfig',
            fileName: () => 'extendedConfig.js',
            formats: ['es'],
            cssFileName: 'extendedConfig'
        },
        copyPublicDir: true,
        rolldownOptions: {
            external: ['react', 'react-dom'],
            platform: 'browser'
        },
        outDir: path.resolve(__dirname, './bundle/langium-dsl'),
        emptyOutDir: true
    },
    optimizeDeps: {
        include: [
            'langium',
            'langium/lsp',
            'langium/grammar',
            'vscode/localExtensionHost',
            'vscode-jsonrpc',
            'vscode-languageclient',
            'vscode-languageserver',
            'vscode-languageserver/browser.js',
            'vscode-languageserver-protocol',
            'vscode-oniguruma',
            'vscode-textmate'
        ]
    },
    worker: {
        format: 'es',
        rolldownOptions: {
            output: {
                entryFileNames: 'assets/workers/[name].js'
            }
        }
    }
});

export default config;

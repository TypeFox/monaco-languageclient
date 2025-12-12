/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';
import * as path from 'node:path';
import { defineConfig } from 'vite';

/// <reference lib="vite/config" />

export const config = defineConfig({
    build: {
        outDir: path.resolve(__dirname, 'production'),
        rolldownOptions: {
            input: {
                index: path.resolve(__dirname, 'index.html')
            },
            output: {
                entryFileNames: '[name].js',
                assetFileNames: 'assets/[name][extname]'
            }
        }
    },
    optimizeDeps: {
        esbuildOptions: {
            plugins: [
                importMetaUrlPlugin
            ]
        },
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
        format: 'es'
    },
    server: {
        cors: {
            origin: '*'
        },
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
        watch: {
            ignored: [
                '**/.chrome/**/*'
            ]
        }
    }
});

export default config;

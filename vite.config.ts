/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { defineConfig } from 'vite';
import fs from 'node:fs';
import * as path from 'node:path';
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';
import vsixPlugin from '@codingame/monaco-vscode-rollup-vsix-plugin';
import react from '@vitejs/plugin-react';

const clangdWasmLocation = 'packages/examples/resources/clangd/wasm/clangd.wasm';

export const definedViteConfig = defineConfig({
    build: {
        target: 'esnext',
        rollupOptions: {
            input: {
                index: path.resolve(__dirname, 'index.html'),
                bare: path.resolve(__dirname, 'packages/examples/bare.html'),
                json: path.resolve(__dirname, 'packages/examples/json.html'),
                browser: path.resolve(__dirname, 'packages/examples/browser.html'),
                langium: path.resolve(__dirname, 'packages/examples/langium.html'),
                statemachine: path.resolve(__dirname, 'packages/examples/statemachine.html'),
                python: path.resolve(__dirname, 'packages/examples/python.html'),
                groovy: path.resolve(__dirname, 'packages/examples/groovy.html'),
                clangd: path.resolve(__dirname, 'packages/examples/clangd.html'),
                appPlayground: path.resolve(__dirname, 'packages/examples/appPlayground.html'),
                twoLangaugeClients: path.resolve(__dirname, 'packages/examples/two_langauge_clients.html'),
                reactStatemachine: path.resolve(__dirname, 'packages/examples/react_statemachine.html'),
                reactPython: path.resolve(__dirname, 'packages/examples/react_python.html'),
                tsExtHost: path.resolve(__dirname, 'packages/examples/ts.html')
            }
        }
    },
    resolve: {
        // not needed here, see https://github.com/TypeFox/monaco-languageclient#vite-dev-server-troubleshooting
        // dedupe: ['vscode']
    },
    server: {
        origin: 'http://localhost:20001',
        port: 20001,
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
        watch: {
            ignored: [
                '**/profile/**/*'
            ]
        }
    },
    optimizeDeps: {
        esbuildOptions: {
            plugins: [
                importMetaUrlPlugin
            ]
        },
        include: [
            'vscode-textmate',
            'vscode-oniguruma'
        ]
    },
    plugins: [
        vsixPlugin(),
        react()
    ],
    define: {
        rootDirectory: JSON.stringify(__dirname),
        // Server-provided Content-Length header may be gzipped, get the real size in build time
        __WASM_SIZE__: fs.existsSync(clangdWasmLocation) ? fs.statSync(clangdWasmLocation).size : 0
    },
    worker: {
        format: 'es'
    }
});

export default definedViteConfig;

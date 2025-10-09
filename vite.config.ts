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

/// <reference lib="rolldown-vite/config" />

export const definedViteConfig = defineConfig({
    build: {
        rollupOptions: {
            input: {
                index: path.resolve(__dirname, 'index.html'),
                json_classic: path.resolve(__dirname, 'packages/examples/json_classic.html'),
                json: path.resolve(__dirname, 'packages/examples/json.html'),
                browser: path.resolve(__dirname, 'packages/examples/browser.html'),
                langium_extended: path.resolve(__dirname, 'packages/examples/langium_extended.html'),
                statemachine: path.resolve(__dirname, 'packages/examples/statemachine.html'),
                python: path.resolve(__dirname, 'packages/examples/python.html'),
                groovy: path.resolve(__dirname, 'packages/examples/groovy.html'),
                clangd: path.resolve(__dirname, 'packages/examples/clangd.html'),
                appPlayground: path.resolve(__dirname, 'packages/examples/appPlayground.html'),
                twoLangaugeClients: path.resolve(__dirname, 'packages/examples/two_langauge_clients.html'),
                reactAppPlayground: path.resolve(__dirname, 'packages/examples/react_appPlayground.html'),
                reactStatemachine: path.resolve(__dirname, 'packages/examples/react_statemachine.html'),
                reactPython: path.resolve(__dirname, 'packages/examples/react_python.html'),
                tsExtHost: path.resolve(__dirname, 'packages/examples/tsExtHost.html'),
                webContainer: path.resolve(__dirname, 'packages/examples/webContainer.html'),
            }
        }
    },
    resolve: {
        // not needed here, see https://github.com/TypeFox/monaco-languageclient#vite-dev-server-troubleshooting
        // dedupe: ['vscode']
    },
    server: {
        port: 20001,
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
    },
    optimizeDeps: {
        esbuildOptions: {
            plugins: [
                importMetaUrlPlugin
            ]
        },
        include: [
            '@codingame/monaco-vscode-standalone-languages',
            '@codingame/monaco-vscode-standalone-css-language-features',
            '@codingame/monaco-vscode-standalone-html-language-features',
            '@codingame/monaco-vscode-standalone-json-language-features',
            '@codingame/monaco-vscode-standalone-typescript-language-features',
            '@testing-library/react',
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
    plugins: [
        {
            // For the *-language-features extensions which use SharedArrayBuffer
            name: 'configure-response-headers',
            apply: 'serve',
            configureServer: (server) => {
                server.middlewares.use((_req, res, next) => {
                    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless')
                    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
                    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
                    next()
                })
            }
        },
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

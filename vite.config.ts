/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { defineConfig as defineViteConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import * as path from 'path';
// import * as fs from 'fs';
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';
import vsixPlugin from '@codingame/monaco-vscode-rollup-vsix-plugin';

const viteConfig = defineViteConfig({
    build: {
        target: 'esnext',
        rollupOptions: {
            input: {
                index: path.resolve(__dirname, 'index.html'),
                // bare monaco-languageclient
                bare: path.resolve(__dirname, 'packages/examples/bare.html'),

                // monaco-editor-wrapper
                // json
                wrapperWebSocket: path.resolve(__dirname, 'packages/examples/wrapper_ws.html'),
                browser: path.resolve(__dirname, 'packages/examples/browser.html'),
                // langium
                wrapperStatemachine: path.resolve(__dirname, 'packages/examples/wrapper_statemachine.html'),
                wrapperLangium: path.resolve(__dirname, 'packages/examples/wrapper_langium.html'),
                // python
                python: path.resolve(__dirname, 'packages/examples/python.html'),
                // grrovy
                groovy: path.resolve(__dirname, 'packages/examples/groovy.html'),

                // monaco-editor-react
                // langium
                reactStatemachine: path.resolve(__dirname, 'packages/examples/react_statemachine.html'),
                // python
                reactPython: path.resolve(__dirname, 'packages/examples/react_python.html'),

                // other examples
                wrapperTs: path.resolve(__dirname, 'packages/examples/wrapper_ts.html'),
                wrapperAdvanced: path.resolve(__dirname, 'packages/examples/wrapper_adv.html'),
            }
        }
    },
    resolve: {
        // not needed here, see https://github.com/TypeFox/monaco-languageclient#vite-dev-server-troubleshooting
        // dedupe: ['vscode']
    },
    server: {
        origin: 'http://localhost:20001',
        port: 20001
    },
    optimizeDeps: {
        esbuildOptions: {
            plugins: [
                importMetaUrlPlugin
            ]
        }
    },
    plugins: [
        vsixPlugin()
    ],
    define: {
        rootDirectory: JSON.stringify(__dirname)
    },
    worker: {
        format: 'es'
    }
});

const vitestConfig = defineVitestConfig({
    test: {
        testTimeout: 10000,
        pool: 'threads',
        poolOptions: {
            threads: {
                isolate: true
            }
        },
        browser: {
            enabled: true,
            headless: true,
            name: 'chrome',
            api: {
                port: 20101
            }
        }
    }
});

export default mergeConfig(viteConfig, vitestConfig);

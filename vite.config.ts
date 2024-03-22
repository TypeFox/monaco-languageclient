/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { defineConfig } from 'vite';
import * as path from 'path';
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';

export default defineConfig(() => {
    const config = {
        build: {
            target: 'esnext',
            rollupOptions: {
                input: {
                    index: path.resolve(__dirname, 'index.html'),
                    bare: path.resolve(__dirname, 'packages/examples/bare.html'),
                    wrapperWebSocket: path.resolve(__dirname, 'packages/examples/wrapper_ws.html'),
                    // integrate locale from old example
                    wrapperStatemachine: path.resolve(__dirname, 'packages/examples/wrapper_statemachine.html'),
                    // share configuration with wrapperStatemachine
                    reactStatemachine: path.resolve(__dirname, 'packages/examples/react_statemachine.html'),
                    wrapperLangium: path.resolve(__dirname, 'packages/examples/wrapper_langium.html'),
                    // python and reactPython share the same configuration
                    python: path.resolve(__dirname, 'packages/examples/python.html'),
                    reactPython: path.resolve(__dirname, 'packages/examples/react_python.html'),
                    // converted to wrapper
                    groovy: path.resolve(__dirname, 'packages/examples/groovy.html'),

                    // other examples
                    wrapperTs: path.resolve(__dirname, 'packages/examples/wrapper_ts.html'),
                    wrapperAdvanced: path.resolve(__dirname, 'packages/examples/wrapper_adv.html'),
                    // what about the common code?
                    browser: path.resolve(__dirname, 'packages/examples/browser.html'),
                    // verification examples
                    verifyWrapper: path.resolve(__dirname, 'packages/examples/verify_wrapper.html'),
                    verifyAlt: path.resolve(__dirname, 'packages/examples/verify_alt.html')
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
        define: {
            rootDirectory: JSON.stringify(__dirname)
        },
        test: {
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
    };
    return config;
});

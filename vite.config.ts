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
        target: 'ES2022',
        rollupOptions: {
            input: {
                index: path.resolve(__dirname, 'index.html'),
                bare: path.resolve(__dirname, 'packages/examples/bare.html'),
                json: path.resolve(__dirname, 'packages/examples/json.html'),
                browser: path.resolve(__dirname, 'packages/examples/browser.html'),
                langium_classic: path.resolve(__dirname, 'packages/examples/langium_classic.html'),
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
                tsExtHost: path.resolve(__dirname, 'packages/examples/tsExtHost.html')
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
            '@codingame/monaco-vscode-api',
            '@codingame/monaco-vscode-configuration-service-override',
            '@codingame/monaco-vscode-cpp-default-extension',
            '@codingame/monaco-vscode-debug-service-override',
            '@codingame/monaco-vscode-editor-api',
            '@codingame/monaco-vscode-editor-service-override',
            '@codingame/monaco-vscode-environment-service-override',
            '@codingame/monaco-vscode-explorer-service-override',
            '@codingame/monaco-vscode-extension-api',
            '@codingame/monaco-vscode-extensions-service-override',
            '@codingame/monaco-vscode-files-service-override',
            '@codingame/monaco-vscode-groovy-default-extension',
            '@codingame/monaco-vscode-java-default-extension',
            '@codingame/monaco-vscode-javascript-default-extension',
            '@codingame/monaco-vscode-json-default-extension',
            '@codingame/monaco-vscode-keybindings-service-override',
            '@codingame/monaco-vscode-language-pack-cs',
            '@codingame/monaco-vscode-language-pack-de',
            '@codingame/monaco-vscode-language-pack-es',
            '@codingame/monaco-vscode-language-pack-fr',
            '@codingame/monaco-vscode-language-pack-it',
            '@codingame/monaco-vscode-language-pack-ja',
            '@codingame/monaco-vscode-language-pack-ko',
            '@codingame/monaco-vscode-language-pack-pl',
            '@codingame/monaco-vscode-language-pack-pt-br',
            '@codingame/monaco-vscode-language-pack-qps-ploc',
            '@codingame/monaco-vscode-language-pack-ru',
            '@codingame/monaco-vscode-language-pack-tr',
            '@codingame/monaco-vscode-language-pack-zh-hans',
            '@codingame/monaco-vscode-language-pack-zh-hant',
            '@codingame/monaco-vscode-languages-service-override',
            '@codingame/monaco-vscode-lifecycle-service-override',
            '@codingame/monaco-vscode-localization-service-override',
            '@codingame/monaco-vscode-log-service-override',
            '@codingame/monaco-vscode-model-service-override',
            '@codingame/monaco-vscode-monarch-service-override',
            '@codingame/monaco-vscode-preferences-service-override',
            '@codingame/monaco-vscode-python-default-extension',
            '@codingame/monaco-vscode-remote-agent-service-override',
            '@codingame/monaco-vscode-search-result-default-extension',
            '@codingame/monaco-vscode-search-service-override',
            '@codingame/monaco-vscode-secret-storage-service-override',
            '@codingame/monaco-vscode-standalone-css-language-features',
            '@codingame/monaco-vscode-standalone-html-language-features',
            '@codingame/monaco-vscode-standalone-json-language-features',
            '@codingame/monaco-vscode-standalone-languages',
            '@codingame/monaco-vscode-standalone-typescript-language-features',
            '@codingame/monaco-vscode-storage-service-override',
            '@codingame/monaco-vscode-testing-service-override',
            '@codingame/monaco-vscode-textmate-service-override',
            '@codingame/monaco-vscode-theme-defaults-default-extension',
            '@codingame/monaco-vscode-theme-service-override',
            '@codingame/monaco-vscode-typescript-basics-default-extension',
            '@codingame/monaco-vscode-typescript-language-features-default-extension',
            '@codingame/monaco-vscode-views-service-override',
            '@codingame/monaco-vscode-workbench-service-override',
            '@testing-library/react',
            'langium',
            'langium/lsp',
            'langium/grammar',
            'vscode/localExtensionHost',
            'vscode-textmate',
            'vscode-oniguruma',
            'vscode-languageclient',
            'vscode-languageserver/browser.js'
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

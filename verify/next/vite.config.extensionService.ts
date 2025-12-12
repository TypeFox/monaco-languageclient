/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import path from 'node:path';
import { defineConfig } from 'vite';
import type { PluginContext } from 'rolldown';

const config = defineConfig({
    optimizeDeps: {
        include: [
            'vscode/localExtensionHost',
            'vscode-oniguruma',
            'vscode-textmate'
        ]
    },
    build: {
        assetsInlineLimit: 1024 * 1024 * 128,
        lib: {
            entry: path.resolve(__dirname, './node_modules/@codingame/monaco-vscode-extensions-service-override/index.js'),
            name: 'extensionService',
            fileName: () => 'extensionService.js',
            formats: ['es'],
            cssFileName: 'extensionService'
        },
        rolldownOptions: {
            output: {
                entryFileNames: '[name].js',
                assetFileNames: '[name][extname]',
                inlineDynamicImports: true
            },
            plugins: [
                {
                    name: 'check-fileLoading',
                    load(this: PluginContext, id: string) {
                        if (id.includes('iframe')) {
                            console.log('checking: ' + id);
                        }
                        if (id.endsWith('extHostExtensionService.js')) {
                            console.log('load: ' + id);

                            // need to be patched in: @codingame/monaco-vscode-extensions-service-override/vscode/src/vs/workbench/services/extensions/worker/webWorkerExtensionHostIframe.html
                            // <meta http-equiv="Content-Security-Policy" content="
                            // default-src 'none';
                            // child-src 'self' data: blob:;
                            // worker-src 'self' data: extension-file: file: blob: 'unsafe-inline';
                            // script-src 'self' 'unsafe-eval' 'sha256-YenIR0w2uOJMq12UhbL15PlQWd7gf4v3ThVTe/nvZZE=' data: extension-file: file: https: http://localhost:* blob:;
                            // connect-src 'self' data: extension-file: file: https: wss: http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*;"/>
                        }
                    }
                }
            ]
        },
        outDir: path.resolve(__dirname, 'bundle/extensionService'),
        emptyOutDir: true
    }
});

export default config;

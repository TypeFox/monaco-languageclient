/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import path from 'node:path';
import { defineConfig } from 'vite';
import type { PluginContext } from 'rolldown';
import fs from 'node:fs';

const config = defineConfig({
    optimizeDeps: {
        include: [
            'vscode/localExtensionHost',
        ]
    },
    build: {
        assetsInlineLimit: 1024 * 1024 * 128,
        lib: {
            entry: path.resolve(__dirname, './node_modules/@codingame/monaco-vscode-api/workers/extensionHost.worker.js'),
            name: 'extensionHostWorker',
            fileName: () => 'extensionHostWorker.js',
            formats: ['es'],
            cssFileName: 'extensionHostWorker'
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
                        if (id.endsWith('html')) {
                            console.log('checking: ' + id);
                        }
                        if (id.endsWith('extHostExtensionService.js')) {
                            console.log('load: ' + id);
                            const code = fs.readFileSync(id, 'utf8');
                            const search = 'const response = await fetch(( browserUri.toString(true)));';
                            const newCode = `console.log("browserUri: " + browserUri.toString());
let newURL = new URL(browserUri.toString().replace('file://', ''), import.meta.url);
console.log("newURL: " + newURL.toString());
const response = await fetch((newURL));`;
                            let outputCode = code.replace(search, newCode);
                            return outputCode;
                        }
                    }
                }
            ]
        },
        outDir: path.resolve(__dirname, 'bundle/extHostWorker'),
        emptyOutDir: true
    }
});

export default config;

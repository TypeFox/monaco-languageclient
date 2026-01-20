/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import path from 'node:path';
import fs from 'node:fs';
import { defineConfig } from 'vite';
import type { PluginContext } from 'rolldown';

const config = defineConfig({
    optimizeDeps: {
        include: [
            'vscode/localExtensionHost'
        ]
    },
    build: {
        assetsInlineLimit: 0, // 1024 * 1024 * 128,
        lib: {
            entry: path.resolve(__dirname, './node_modules/@codingame/monaco-vscode-textmate-service-override/worker.js'),
            name: 'textmateWorker',
            fileName: () => 'textmateWorker.js',
            formats: ['es'],
            cssFileName: 'textmateWorker'
        },
        rolldownOptions: {
            output: {
                entryFileNames: '[name].js',
                assetFileNames: '[name][extname]',
                inlineDynamicImports: true
            },
            plugins: [
                {
                    name: 'inline-wasm',
                    load(this: PluginContext, id: string) {

                        if (id.endsWith('textMateTokenizationWorker.worker.js')) {
                            const code = fs.readFileSync(id, 'utf8');
                            const base64 = fs.readFileSync('./node_modules/@codingame/monaco-vscode-textmate-service-override/external/vscode-oniguruma/release/onig.wasm', 'base64');
                            let outputCode = code.replace(
                                'const response = await fetch(onigurumaWASMUri);',
                                `const response = await fetch('data:application/wasm;base64,${base64}')`
                            );
                            return outputCode;
                        }
                    }
                }
            ]
        },
        outDir: path.resolve(__dirname, 'bundle/textmateWorker'),
        emptyOutDir: true
    }

});

export default config;

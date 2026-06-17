/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import path from 'node:path';
import { defineConfig } from 'vite';

const config = defineConfig({
  optimizeDeps: {
    include: ['vscode/localExtensionHost']
  },
  build: {
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
        codeSplitting: false
      }
    },
    outDir: path.resolve(__dirname, 'bundle'),
    emptyOutDir: false
  }
});

export default config;

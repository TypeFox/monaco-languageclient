/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import path from 'node:path';
import { defineConfig } from 'vite';

const config = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, './node_modules/@codingame/monaco-vscode-api/workers/editor.worker.js'),
      name: 'editor.worker',
      fileName: () => 'editor.worker.js',
      formats: ['es'],
      cssFileName: 'editor.worker'
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

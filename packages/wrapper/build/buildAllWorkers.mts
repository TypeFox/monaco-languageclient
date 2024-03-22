/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { bundleWorker } from './buildWorker.mjs';
import { Format } from 'esbuild';

// build only ecma script workers
const format = 'esm' as Format;
const promises = [] as Array<Promise<void>>;
promises.push(bundleWorker(
    format,
    '../../node_modules/monaco-editor/esm/vs/editor/editor.worker.js',
    './dist/workers-esbuild/editorWorker-es.js'
));

promises.push(bundleWorker(
    format,
    '../../node_modules/@codingame/monaco-vscode-standalone-typescript-language-features/worker.js',
    './dist/workers-esbuild/tsWorker-es.js'
));

promises.push(bundleWorker(
    format,
    '../../node_modules/@codingame/monaco-vscode-standalone-html-language-features/worker.js',
    './dist/workers-esbuild/htmlWorker-es.js'
));

promises.push(bundleWorker(
    format,
    '../../node_modules/@codingame/monaco-vscode-standalone-css-language-features/worker.js',
    './dist/workers-esbuild/cssWorker-es.js'
));

promises.push(bundleWorker(
    format,
    '../../node_modules/@codingame/monaco-vscode-standalone-json-language-features/worker.js',
    './dist/workers-esbuild/jsonWorker-es.js'
));

await Promise.all(promises)
    .then(() => console.log('Successfully created all workers'))
    .catch(e => console.error(e));

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { bundleWorker } from './buildWorker.mjs';
import { Format } from 'esbuild';

// build only ecma script workers
const format = 'esm' as Format;
const promises = [] as Array<Promise<void>>;
promises.push(bundleWorker(
    format,
    '../../node_modules/@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js',
    './dist/workers-esbuild/editorWorker-es.js'
));

promises.push(bundleWorker(
    format,
    '../../node_modules/monaco-editor-ms/esm/vs/language/typescript/ts.worker.js',
    './dist/workers-esbuild/tsWorker-es.js'
));

promises.push(bundleWorker(
    format,
    '../../node_modules/monaco-editor-ms/esm/vs/language/html/html.worker.js',
    './dist/workers-esbuild/htmlWorker-es.js'
));

promises.push(bundleWorker(
    format,
    '../../node_modules/monaco-editor-ms/esm/vs/language/css/css.worker.js',
    './dist/workers-esbuild/cssWorker-es.js'
));

promises.push(bundleWorker(
    format,
    '../../node_modules/monaco-editor-ms/esm/vs/language/json/json.worker.js',
    './dist/workers-esbuild/jsonWorker-es.js'
));

await Promise.all(promises)
    .then(() => console.log('Successfully created all workers'))
    .catch(e => console.error(e));

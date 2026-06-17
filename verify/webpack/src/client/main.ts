/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import '@codingame/monaco-vscode-json-default-extension';
import { runExtendedClient } from 'monaco-languageclient-examples';
import { jsontLsConfig } from 'monaco-languageclient-examples/json-client';
import { Worker, WorkerLoader } from 'monaco-languageclient/workerFactory';

const runJsonWrapper = async () => {
  const helloJsonCode = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": {"value": "unix"}
}`;

  const defineWorkerLoaders: () => Partial<Record<string, WorkerLoader>> = () => {
    const defaultEditorWorkerService = () => new Worker(new URL('../../bundle/editor.worker.js', import.meta.url), { type: 'module' });
    const defaultTextMateWorker = () => new Worker(new URL('../../bundle/worker.js', import.meta.url), { type: 'module' });

    return {
      editorWorkerService: defaultEditorWorkerService,
      TextMateWorker: defaultTextMateWorker
    };
  };
  jsontLsConfig.workerLoaders = defineWorkerLoaders;
  await runExtendedClient(jsontLsConfig, helloJsonCode);
};

await runJsonWrapper();

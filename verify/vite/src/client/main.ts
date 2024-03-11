/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { useWorkerFactory, CrossOriginWorkerDefintion } from 'monaco-editor-wrapper/workerFactory';

useWorkerFactory({
    ignoreDefaultMapping: true,
    workerLoaders: {
        editorWorkerService: new CrossOriginWorkerDefintion(
            new Worker(new URL('@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' })
        )
    }
});

import { executeJsonClient } from 'monaco-languageclient-examples/json-client';
executeJsonClient();

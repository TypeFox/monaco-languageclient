/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import { ConsoleLogger } from '@codingame/monaco-vscode-log-service-override';
import { getEnhancedMonacoEnvironment } from 'monaco-languageclient/vscodeApiWrapper';
import { useWorkerFactory, Worker } from 'monaco-languageclient/workerFactory';
import { describe, expect, test } from 'vitest';

describe('WorkerFactory Tests', () => {

    test('useWorkerFactory: Nothing', () => {

        useWorkerFactory({});

        const worker = getEnhancedMonacoEnvironment().getWorker?.('test', 'TextEditorWorker');
        expect(worker).toBeUndefined();
        const workerUrl = getEnhancedMonacoEnvironment().getWorkerUrl?.('test', 'TextEditorWorker');
        expect(workerUrl).toBeUndefined();
    });

    test('useWorkerFactory: TextEditorWorker', async () => {
        const logger = new ConsoleLogger(LogLevel.Info);

        useWorkerFactory({
            workerLoaders: {
                editorWorkerService: () => new Worker(
                    new URL('@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js', import.meta.url),
                    { type: 'module' }
                )
            },
            logger
        });

        const workerUrl = getEnhancedMonacoEnvironment().getWorkerUrl?.('test', 'editorWorkerService');
        expect(workerUrl).contains('@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js?worker_file&type=module');
        const workerOptions = getEnhancedMonacoEnvironment().getWorkerOptions?.('test', 'editorWorkerService');
        expect(workerOptions).toEqual({ type: 'module' });
    });

});

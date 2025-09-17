/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { ConsoleLogger } from 'monaco-languageclient/common';
import { useWorkerFactory } from 'monaco-languageclient/workerFactory';
import { getEnhancedMonacoEnvironment } from 'monaco-languageclient/vscodeApiWrapper';

describe('WorkerFactory Tests', () => {

    test('useWorkerFactory: Nothing', () => {

        useWorkerFactory({});

        const getWorker = () => getEnhancedMonacoEnvironment().getWorker?.('test', 'TextEditorWorker');
        expect(getWorker).toThrowError('Unimplemented worker TextEditorWorker (test)');
    });

    test('useWorkerFactory: TextEditorWorker', async () => {
        const logger = new ConsoleLogger(LogLevel.Info);

        useWorkerFactory({
            workerLoaders: {
                TextEditorWorker: () => new Worker(
                    new URL('@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js', import.meta.url),
                    { type: 'module' }
                )
            },
            logger
        });

        const getWorker = () => getEnhancedMonacoEnvironment().getWorker?.('test', 'TextEditorWorker');
        const workerFunc = getWorker();
        expect(workerFunc).toBeDefined();
        expect(workerFunc).toBeInstanceOf(Worker);
    });

});

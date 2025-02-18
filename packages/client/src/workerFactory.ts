/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { initEnhancedMonacoEnvironment } from 'monaco-languageclient/vscode/services';
import type { Logger } from 'monaco-languageclient/tools';

export type WorkerLoader = (() => Worker) | undefined;

export interface WorkerFactoryConfig {
    workerLoaders: Record<string, WorkerLoader>;
    logger?: Logger;
    getWorkerOverride?: (moduleId: string, label: string) => Worker;
}

export const useWorkerFactory = (config: WorkerFactoryConfig) => {
    const envEnhanced = initEnhancedMonacoEnvironment();

    const getWorker = (moduleId: string, label: string) => {
        config.logger?.info(`getWorker: moduleId: ${moduleId} label: ${label}`);

        const workerFunc = config.workerLoaders[label];
        if (workerFunc === undefined) {
            throw new Error(`Unimplemented worker ${label} (${moduleId})`);
        }
        return workerFunc();
    };
    envEnhanced.getWorker = config.getWorkerOverride ?? getWorker;
};

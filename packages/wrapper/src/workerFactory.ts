/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { initEnhancedMonacoEnvironment } from 'monaco-languageclient/vscode/services';
import { Logger } from 'monaco-languageclient/tools';

export type WorkerLoader = () => Worker;

export interface WorkerFactoryConfig {
    workerLoaders: Partial<Record<string, WorkerLoader>>;
    logger?: Logger;
}

export const useWorkerFactory = (config: WorkerFactoryConfig) => {
    const envEnhanced = initEnhancedMonacoEnvironment();

    const getWorker = (moduleId: string, label: string) => {
        config.logger?.info(`getWorker: moduleId: ${moduleId} label: ${label}`);

        const workerFunc = config.workerLoaders[label];
        if (workerFunc !== undefined) {
            return workerFunc();
        } else {
            throw new Error(`Unimplemented worker ${label} (${moduleId})`);
        }
    };
    envEnhanced.getWorker = getWorker;
};

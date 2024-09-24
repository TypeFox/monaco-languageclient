/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { initEnhancedMonacoEnvironment } from 'monaco-languageclient/vscode/services';
import { Logger } from 'monaco-languageclient/tools';

export interface WorkerOverrides {
    workerLoaders?: Partial<Record<string, WorkerLoader>>;
    ignoreMapping?: boolean;
    userDefinedMapping?: (label: string) => string;
}

export type WorkerLoader = () => Worker;

export interface WorkerFactoryConfig {
    workerOverrides?: WorkerOverrides;
    logger?: Logger;
}

export const defaultWorkerLoaders: Partial<Record<string, WorkerLoader>> = {
    editorWorker: () => new Worker(new URL('monaco-editor-wrapper/workers/module/editor', import.meta.url), { type: 'module' }),
    tsWorker: () => new Worker(new URL('monaco-editor-wrapper/workers/module/ts', import.meta.url), { type: 'module' }),
    htmlWorker: () => new Worker(new URL('monaco-editor-wrapper/workers/module/html', import.meta.url), { type: 'module' }),
    cssWorker: () => new Worker(new URL('monaco-editor-wrapper/workers/module/css', import.meta.url), { type: 'module' }),
    jsonWorker: () => new Worker(new URL('monaco-editor-wrapper/workers/module/json', import.meta.url), { type: 'module' })
};

export const useWorkerFactory = (config: WorkerFactoryConfig) => {
    const envEnhanced = initEnhancedMonacoEnvironment();

    const getWorker = (moduleId: string, label: string) => {
        config.logger?.info(`getWorker: moduleId: ${moduleId} label: ${label}`);

        let selector = label;
        let workerLoaders;

        // if you choose to ignore the default mapping only the workerLoaders passed with workerOverrides are used
        if (config.workerOverrides?.ignoreMapping === true) {
            workerLoaders = {
                ...config.workerOverrides.workerLoaders
            };
        } else {
            workerLoaders = {
                ...defaultWorkerLoaders, ...config.workerOverrides?.workerLoaders
            };

            let mappingFunc = useDefaultWorkerMapping;
            if (config.workerOverrides?.userDefinedMapping) {
                mappingFunc = config.workerOverrides.userDefinedMapping;
            }
            selector = mappingFunc(label);
        }

        const workerFunc = workerLoaders[selector];
        if (workerFunc !== undefined) {
            return workerFunc();
        } else {
            throw new Error(`Unimplemented worker ${label} (${moduleId})`);
        }
    };
    envEnhanced.getWorker = getWorker;
};

export const useDefaultWorkerMapping = (label: string) => {
    switch (label) {
        case 'editor':
        case 'editorWorkerService':
        case 'TextEditorWorker':
            return 'editorWorker';
        case 'typescript':
        case 'javascript':
            return 'tsWorker';
        case 'html':
        case 'handlebars':
        case 'razor':
            return 'htmlWorker';
        case 'css':
        case 'scss':
        case 'less':
            return 'cssWorker';
        case 'json':
            return 'jsonWorker';
        default:
            return label;
    }
};

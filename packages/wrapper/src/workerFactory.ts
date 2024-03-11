/* eslint-disable header/header */
import { Environment } from '@codingame/monaco-vscode-editor-api';

export type WorkerOverrides = {
    rootPath?: string| URL;
    basePath?: string| URL;
    workerLoaders?: Partial<Record<string, CrossOriginWorkerDefintion>>;
    ignoreDefaultMapping?: boolean;
}

export type CrossOriginWorkerConfig = {
    rootPath: string| URL;
    basePath?: string| URL;
    workerFile: string| URL;
    options?: WorkerOptions;
}

export interface MonacoEnvironmentEnhanced extends Environment {
    workerOverrides?: WorkerOverrides;
    vscodeApiInitialised: boolean;
}

/**
 * Cross origin workers don't work
 * The workaround used by vscode is to start a worker on a blob url containing a short script calling 'importScripts'
 * importScripts accepts to load the code inside the blob worker
 */
export class CrossOriginWorkerDefintion {
    config: CrossOriginWorkerConfig | undefined;
    fullUrl: string;
    worker: Worker | undefined;

    constructor(configOrWorker: CrossOriginWorkerConfig | Worker) {
        if (Object.hasOwn(configOrWorker, 'workerFile')) {
            this.config = configOrWorker as CrossOriginWorkerConfig;
        } else {
            this.worker = configOrWorker as Worker;
        }
    }

    createWorker(workerOverrides?: WorkerOverrides) {
        if (!this.worker) {
            if (this.config) {
                if (workerOverrides?.rootPath) {
                    this.config.rootPath = workerOverrides.rootPath;
                }
                if (workerOverrides?.basePath) {
                    this.config.basePath = workerOverrides.basePath;
                }
                let workerFile = this.config.workerFile;
                if (this.config.basePath) {
                    workerFile = `${this.config.basePath}/${this.config.workerFile}`;
                }
                this.fullUrl = new URL(workerFile, this.config.rootPath).href;
                console.log(`Creating worker: ${this.fullUrl}`);

                const js = this.config.options?.type === 'module' ? `import '${this.fullUrl}';` : `importScripts('${this.fullUrl}');`;
                const blob = new Blob([js], { type: 'application/javascript' });

                this.worker = new Worker(URL.createObjectURL(blob), this.config.options);
            } else {
                throw new Error('No worker or config provided');
            }
        } else {
            console.log('Using provided worker');
        }
        return this.worker;
    }
}

export const defaultWorkerLoaders: Partial<Record<string, CrossOriginWorkerDefintion>> = {
    editorWorker: new CrossOriginWorkerDefintion({
        rootPath: import.meta.url,
        workerFile: 'monaco-editor-wrapper/dist/workers/editorWorker-es.js',
        options: {
            type: 'module'
        }
    }),
    tsWorker: new CrossOriginWorkerDefintion({
        rootPath: import.meta.url,
        workerFile: 'monaco-editor-wrapper/dist/workers/tsWorker-es.js',
        options: {
            type: 'module'
        }
    }),
    htmlWorker: new CrossOriginWorkerDefintion({
        rootPath: import.meta.url,
        workerFile: 'monaco-editor-wrapper/dist/workers/htmlWorker-es.js',
        options: {
            type: 'module'
        }
    }),
    cssWorker: new CrossOriginWorkerDefintion({
        rootPath: import.meta.url,
        workerFile: 'monaco-editor-wrapper/dist/workers/cssWorker-es.js',
        options: {
            type: 'module'
        }
    }),
    jsonWorker: new CrossOriginWorkerDefintion({
        rootPath: import.meta.url,
        workerFile: 'monaco-editor-wrapper/dist/workers/jsonWorker-es.js',
        options: {
            type: 'module'
        }
    })
};

export const useWorkerFactory = (workerOverrides?: WorkerOverrides) => {
    const monWin = (self as Window);
    if (!monWin.MonacoEnvironment) {
        monWin.MonacoEnvironment = {};
    }
    const monEnv = monWin.MonacoEnvironment as MonacoEnvironmentEnhanced;
    monEnv.workerOverrides = workerOverrides;

    // if you choose to ignore the default mapping only the
    // workerLoaders passed with workerOverrides are used
    const ignoreDefaultMapping = workerOverrides?.ignoreDefaultMapping === true;
    const workerLoaders = ignoreDefaultMapping ? {
        ...workerOverrides?.workerLoaders
    } : {
        ...defaultWorkerLoaders, ...workerOverrides?.workerLoaders
    };
    const getWorker = (moduleId: string, label: string ) => {
        console.log(`getWorker: moduleId: ${moduleId} label: ${label}`);

        let selector = label;
        if (!ignoreDefaultMapping) {
            switch (selector) {
                case 'editor':
                case 'editorWorkerService':
                    selector = 'editorWorker';
                    break;
                case 'typescript':
                case 'javascript':
                    selector = 'tsWorker';
                    break;
                case 'html':
                case 'handlebars':
                case 'razor':
                    selector = 'htmlWorker';
                    break;
                case 'css':
                case 'scss':
                case 'less':
                    selector = 'cssWorker';
                    break;
                case 'json':
                    selector = 'jsonWorker';
                    break;
                default:
                    break;
            }
        }

        const workerFactory = workerLoaders[selector];
        const worker = workerFactory?.createWorker(workerOverrides);
        if (!worker) {
            throw new Error(`Unimplemented worker ${label} (${moduleId})`);
        }
        return worker;
    };

    monEnv.getWorker = getWorker;
};


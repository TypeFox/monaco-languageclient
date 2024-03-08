/* eslint-disable header/header */
import { Environment } from '@codingame/monaco-vscode-editor-api';

export type WorkerOverrides = {
    rootPath?: string| URL;
    basePath?: string| URL;
    options?: WorkerOptions;
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
class CrossOriginWorkerDefintion {
    config: CrossOriginWorkerConfig;
    fullUrl: string;
    worker: Worker;

    constructor(config: CrossOriginWorkerConfig) {
        this.config = config;
    }

    createWorker() {
        let workerFile = this.config.workerFile;
        if (this.config.basePath) {
            workerFile = `${this.config.basePath}/${this.config.workerFile}`;
        }
        this.fullUrl = new URL(workerFile, this.config.rootPath).href;
        console.log(`Creating worker: ${this.fullUrl}`);

        const js = this.config.options?.type === 'module' ? `import '${this.fullUrl}';` : `importScripts('${this.fullUrl}');`;
        const blob = new Blob([js], { type: 'application/javascript' });

        this.worker = new Worker(URL.createObjectURL(blob), this.config.options);
        return this.worker;
    }
}

export const defaultWorkerLoaders: Partial<Record<string, CrossOriginWorkerDefintion>> = {
    editorWorkerModule: new CrossOriginWorkerDefintion({
        rootPath: import.meta.url,
        workerFile: 'monaco-editor-wrapper/dist/workers/editorWorker-es.js',
        options: {
            type: 'module'
        }
    }),
    editorWorkerClassic: new CrossOriginWorkerDefintion({
        rootPath: import.meta.url,
        workerFile: 'monaco-editor-wrapper/dist/workers/editorWorker-iife.js',
        options: {
            type: 'classic'
        }
    }),
    tsWorkerModule: new CrossOriginWorkerDefintion({
        rootPath: import.meta.url,
        workerFile: 'monaco-editor-wrapper/dist/workers/tsWorker-es.js',
        options: {
            type: 'module'
        }
    }),
    tsWorkerClassic: new CrossOriginWorkerDefintion({
        rootPath: import.meta.url,
        workerFile: 'monaco-editor-wrapper/dist/workers/tsWorker-iife.js',
        options: {
            type: 'classic'
        }
    }),
    htmlWorkerModule: new CrossOriginWorkerDefintion({
        rootPath: import.meta.url,
        workerFile: 'monaco-editor-wrapper/dist/workers/htmlWorker-es.js',
        options: {
            type: 'module'
        }
    }),
    htmlWorkerClassic: new CrossOriginWorkerDefintion({
        rootPath: import.meta.url,
        workerFile: 'monaco-editor-wrapper/dist/workers/htmlWorker-iife.js',
        options: {
            type: 'classic'
        }
    }),
    cssWorkerModule: new CrossOriginWorkerDefintion({
        rootPath: import.meta.url,
        workerFile: 'monaco-editor-wrapper/dist/workers/cssWorker-es.js',
        options: {
            type: 'module'
        }
    }),
    cssWorkerClassic: new CrossOriginWorkerDefintion({
        rootPath: import.meta.url,
        workerFile: 'monaco-editor-wrapper/dist/workers/cssWorker-iife.js',
        options: {
            type: 'classic'
        }
    }),
    jsonWorkerModule: new CrossOriginWorkerDefintion({
        rootPath: import.meta.url,
        workerFile: 'monaco-editor-wrapper/dist/workers/jsonWorker-es.js',
        options: {
            type: 'module'
        }
    }),
    jsonWorkerClassic: new CrossOriginWorkerDefintion({
        rootPath: import.meta.url,
        workerFile: 'monaco-editor-wrapper/dist/workers/jsonWorker-iife.js',
        options: {
            type: 'classic'
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
            const useClassicWorkers = workerOverrides?.options?.type === 'classic';
            switch (selector) {
                case 'editor':
                case 'editorWorkerService':
                    selector = useClassicWorkers ? 'editorWorkerClassic' : 'editorWorkerModule';
                    break;
                case 'typescript':
                case 'javascript':
                    selector = useClassicWorkers ? 'tsWorkerClassic' : 'tsWorkerModule';
                    break;
                case 'html':
                case 'handlebars':
                case 'razor':
                    selector = useClassicWorkers ? 'htmlWorkerClassic' : 'htmlWorkerModule';
                    break;
                case 'css':
                case 'scss':
                case 'less':
                    selector = useClassicWorkers ? 'cssWorkerClassic' : 'cssWorkerModule';
                    break;
                case 'json':
                    selector = useClassicWorkers ? 'jsonWorkerClassic' : 'jsonWorkerModule';
                    break;
                default:
                    break;
            }
        }

        const workerFactory = workerLoaders[selector];
        if (workerFactory !== undefined && workerFactory !== null) {
            // override paths
            if (workerOverrides?.rootPath) {
                workerFactory.config.rootPath = workerOverrides.rootPath;
            }
            if (workerOverrides?.basePath) {
                workerFactory.config.basePath = workerOverrides.basePath;
            }
            if (workerOverrides?.options) {
                workerFactory.config.options = workerOverrides.options;
            }
            return workerFactory.createWorker();
        } else {
            throw new Error(`Unimplemented worker ${label} (${moduleId})`);
        }
    };

    monEnv.getWorker = getWorker;
};


/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor';
import { DisposableStore } from 'vscode/monaco';
import { LogLevel } from 'vscode/services';
import { registerExtension, IExtensionManifest, ExtensionHostKind, RegisterExtensionResult } from 'vscode/extensions';
import { MonacoLanguageClient } from 'monaco-languageclient';
import { initServices, InitServicesInstructions, VscodeApiConfig } from 'monaco-languageclient/vscode/services';
import { Logger, ConsoleLogger } from 'monaco-languageclient/tools';
import { augmentVscodeApiConfig, checkServiceConsistency, OverallConfigType, VscodeServicesConfig } from './vscode/services.js';
import { CodeResources, EditorApp, EditorAppConfig, ModelRefs, TextContents, TextModels, verifyUrlOrCreateDataUrl } from './editorApp.js';
import { LanguageClientConfig, LanguageClientWrapper } from './languageClientWrapper.js';

export interface ExtensionConfig {
    config: IExtensionManifest | object;
    filesOrContents?: Map<string, string | URL>;
}

export interface WrapperConfig {
    $type: OverallConfigType;
    htmlContainer: HTMLElement;
    id?: string;
    logLevel?: LogLevel | number;
    extensions?: ExtensionConfig[];
    vscodeApiConfig?: VscodeApiConfig;
    editorAppConfig?: EditorAppConfig;
    languageClientConfigs?: Record<string, LanguageClientConfig>;
}

/**
 * This class is responsible for the overall ochestration.
 * It inits, start and disposes the editor apps and the language client (if configured) and provides
 * access to all required components.
 */
export class MonacoEditorLanguageClientWrapper {

    private id: string;
    private editorApp?: EditorApp;
    private extensionRegisterResults: Map<string, | RegisterExtensionResult> = new Map();
    private disposableStore?: DisposableStore;
    private languageClientWrappers: Map<string, LanguageClientWrapper> = new Map();
    private wrapperConfig?: WrapperConfig;
    private logger: Logger = new ConsoleLogger();
    private initDone = false;
    private starting?: Promise<void>;
    private startAwait: (value: void | PromiseLike<void>) => void;
    private stopping?: Promise<void>;
    private stopAwait: (value: void | PromiseLike<void>) => void;

    /**
     * Perform an isolated initialization of the user services and the languageclient wrapper (if used).
     */
    async init(wrapperConfig: WrapperConfig) {
        this.markStarting();
        if (this.initDone) {
            throw new Error('init was already performed. Please call dispose first if you want to re-start.');
        }

        const editorAppConfig = wrapperConfig.editorAppConfig;
        if ((editorAppConfig?.useDiffEditor ?? false) && !editorAppConfig?.codeResources?.original) {
            throw new Error(`Use diff editor was used without a valid config. code: ${editorAppConfig?.codeResources?.main} codeOriginal: ${editorAppConfig?.codeResources?.original}`);
        }

        const viewServiceType = wrapperConfig.vscodeApiConfig?.viewsConfig?.viewServiceType ?? 'EditorService';
        if (wrapperConfig.$type === 'classic' && (viewServiceType === 'ViewsService' || viewServiceType === 'WorkspaceService')) {
            throw new Error(`View Service Type "${viewServiceType}" cannot be used with classic configuration.`);
        }

        // Always dispose old instances before start and
        // ensure disposable store is available again after dispose
        this.dispose(false);
        this.disposableStore = new DisposableStore();

        this.id = wrapperConfig.id ?? Math.floor(Math.random() * 101).toString();

        this.logger.setLevel(wrapperConfig.logLevel ?? LogLevel.Off);
        if (typeof wrapperConfig.editorAppConfig?.monacoWorkerFactory === 'function') {
            wrapperConfig.editorAppConfig.monacoWorkerFactory(this.logger);
        }

        if (!(wrapperConfig.vscodeApiConfig?.vscodeApiInitPerformExternally === true)) {
            wrapperConfig.vscodeApiConfig = await configureAndInitVscodeApi(wrapperConfig.$type, {
                vscodeApiConfig: wrapperConfig.vscodeApiConfig ?? {},
                logLevel: this.logger.getLevel(),
                // workaround for classic monaco-editor not applying semanticHighlighting
                semanticHighlighting: wrapperConfig.editorAppConfig?.editorOptions?.['semanticHighlighting.enabled'] === true
            }, {
                htmlContainer: wrapperConfig.htmlContainer,
                caller: `monaco-editor (${this.id})`,
                performServiceConsistencyChecks: checkServiceConsistency,
                logger: this.logger
            });
        }
        this.wrapperConfig = wrapperConfig;

        await this.initLanguageClients();
        await this.initExtensions();
        this.editorApp = new EditorApp(this.id, wrapperConfig.$type, wrapperConfig.editorAppConfig, this.logger);

        this.initDone = true;
    }

    async initLanguageClients() {
        const lccEntries = Object.entries(this.wrapperConfig?.languageClientConfigs ?? {});
        if (lccEntries.length > 0) {
            for (const [languageId, lcc] of lccEntries) {
                const lcw = new LanguageClientWrapper({
                    languageClientConfig: lcc,
                    logger: this.logger
                });
                this.languageClientWrappers.set(languageId, lcw);
            }
        }
    }

    async initExtensions() {
        const vscodeApiConfig = this.wrapperConfig?.vscodeApiConfig;
        if (this.wrapperConfig?.$type === 'extended' && (vscodeApiConfig?.loadThemes === undefined ? true : vscodeApiConfig.loadThemes === true)) {
            await import('@codingame/monaco-vscode-theme-defaults-default-extension');
        }

        const extensions = this.wrapperConfig?.extensions;
        if (this.wrapperConfig?.extensions) {
            const allPromises: Array<Promise<void>> = [];
            for (const extensionConfig of extensions ?? []) {
                const manifest = extensionConfig.config as IExtensionManifest;
                const extRegResult = registerExtension(manifest, ExtensionHostKind.LocalProcess);
                this.extensionRegisterResults.set(manifest.name, extRegResult);
                if (extensionConfig.filesOrContents && Object.hasOwn(extRegResult, 'registerFileUrl')) {
                    for (const entry of extensionConfig.filesOrContents) {
                        this.disposableStore?.add(extRegResult.registerFileUrl(entry[0], verifyUrlOrCreateDataUrl(entry[1])));
                    }
                }
                allPromises.push(extRegResult.whenReady());
            }
            await Promise.all(allPromises);
        }
    };

    getWrapperConfig() {
        return this.wrapperConfig;
    }

    getExtensionRegisterResult(extensionName: string) {
        return this.extensionRegisterResults.get(extensionName);
    }

    /**
     * Performs a full user configuration and the languageclient wrapper (if used) init and then start the application.
     */
    async initAndStart(wrapperConfig: WrapperConfig) {
        await this.init(wrapperConfig);
        await this.start();
    }

    /**
     * Does not perform any user configuration or other application init and just starts the application.
     */
    async start(htmlContainer?: HTMLElement) {
        if (!this.initDone) {
            throw new Error('No init was performed. Please call init() before start()');
        }

        this.logger.info(`Starting monaco-editor (${this.id})`);
        const html = htmlContainer === undefined ? this.wrapperConfig!.htmlContainer : htmlContainer;
        await this.editorApp?.createEditors(html);

        await this.startLanguageClients();

        this.markStarted();
    }

    async startLanguageClients() {
        const allPromises: Array<Promise<void>> = [];
        for (const lcw of this.languageClientWrappers.values()) {
            allPromises.push(lcw.start());
        }
        return Promise.all(allPromises);
    }

    private markStarting() {
        this.starting = new Promise<void>((resolve) => {
            this.startAwait = resolve;
        });
    }

    private markStarted() {
        this.startAwait();
        this.starting = undefined;
    }

    isStarting() {
        return this.starting;
    }

    isInitDone() {
        return this.initDone;
    }

    isStarted(): boolean {
        // fast-fail
        if (!(this.editorApp?.haveEditor() ?? false)) {
            return false;
        }

        for (const lcw of this.languageClientWrappers.values()) {
            if (lcw.haveLanguageClient()) {
                // as soon as one is not started return
                if (!lcw.isStarted()) {
                    return false;
                }
            }
        }
        return true;
    }

    haveLanguageClients(): boolean {
        return this.languageClientWrappers.size > 0;
    }

    getMonacoEditorApp() {
        return this.editorApp;
    }

    getEditor(): monaco.editor.IStandaloneCodeEditor | undefined {
        return this.editorApp?.getEditor();
    }

    getDiffEditor(): monaco.editor.IStandaloneDiffEditor | undefined {
        return this.editorApp?.getDiffEditor();
    }

    getLanguageClientWrapper(languageId: string): LanguageClientWrapper | undefined {
        return this.languageClientWrappers.get(languageId);
    }

    getLanguageClient(languageId: string): MonacoLanguageClient | undefined {
        return this.languageClientWrappers.get(languageId)?.getLanguageClient();
    }

    getTextContents(): TextContents | undefined {
        return this.editorApp?.getTextContents();
    }

    getTextModels(): TextModels | undefined {
        return this.editorApp?.getTextModels();
    }

    getModelRefs(): ModelRefs | undefined {
        return this.editorApp?.getModelRefs();
    }

    getWorker(languageId: string): Worker | undefined {
        return this.languageClientWrappers.get(languageId)?.getWorker();
    }

    getLogger() {
        return this.logger;
    }

    async updateCodeResources(codeResources?: CodeResources): Promise<void> {
        return this.editorApp?.updateCodeResources(codeResources);
    }

    registerModelUpdate(modelUpdateCallback: (textModels: TextModels) => void) {
        this.editorApp?.registerModelUpdate(modelUpdateCallback);
    }

    updateEditorModels(modelRefs: ModelRefs) {
        this.editorApp?.updateEditorModels(modelRefs);
    }

    reportStatus() {
        const status: string[] = [];
        status.push('Wrapper status:');
        status.push(`Editor: ${this.editorApp?.getEditor()?.getId()}`);
        status.push(`DiffEditor: ${this.editorApp?.getDiffEditor()?.getId()}`);
        return status;
    }

    /**
     * Disposes all application and editor resources, plus the languageclient (if used).
     */
    async dispose(doDisposeLanguageClients: boolean = true) {
        this.markStopping();

        this.editorApp?.disposeApp();
        this.editorApp = undefined;

        this.extensionRegisterResults.forEach((k) => k.dispose());
        this.disposableStore?.dispose();

        if (doDisposeLanguageClients) {
            await disposeLanguageClients(this.languageClientWrappers.values(), false);
        }

        this.initDone = false;
        this.markStopped();
    }

    private markStopping() {
        this.stopping = new Promise<void>((resolve) => {
            this.stopAwait = resolve;
        });
    }

    private markStopped() {
        this.stopAwait();
        this.stopping = undefined;
    }

    isStopping() {
        return this.stopping;
    }

    updateLayout() {
        this.editorApp?.updateLayout();
    }

}

export const configureAndInitVscodeApi = async ($type: OverallConfigType, config: VscodeServicesConfig, initInstructions: InitServicesInstructions) => {
    const vscodeApiConfigAugmented = await augmentVscodeApiConfig($type, config);
    await initServices(vscodeApiConfigAugmented, initInstructions);
    return vscodeApiConfigAugmented;
};

export const disposeLanguageClients = async (languageClientWrappers: LanguageClientWrapper[] | MapIterator<LanguageClientWrapper>, keepWorker: boolean) => {
    const allPromises: Array<Promise<void>> = [];
    for (const lcw of languageClientWrappers) {
        if (lcw.haveLanguageClient()) {
            allPromises.push(lcw.disposeLanguageClient(keepWorker));
        }
    }
    return Promise.all(allPromises);
};

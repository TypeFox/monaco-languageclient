/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type * as vscode from 'vscode';
import * as monaco from 'monaco-editor';
import { DisposableStore } from 'vscode/monaco';
import { LogLevel } from 'vscode/services';
import { registerExtension, IExtensionManifest, ExtensionHostKind } from 'vscode/extensions';
import { MonacoLanguageClient } from 'monaco-languageclient';
import { initServices, InitServicesInstructions, VscodeApiConfig } from 'monaco-languageclient/vscode/services';
import { Logger, ConsoleLogger } from 'monaco-languageclient/tools';
import { augmentVscodeApiConfig, checkServiceConsistency, VscodeServicesConfig } from './vscode/services.js';
import { CodeResources, EditorApp, EditorAppConfig, ModelRefs, TextContents, TextModels, verifyUrlOrCreateDataUrl } from './editorApp.js';
import { LanguageClientConfig, LanguageClientWrapper } from './languageClientWrapper.js';

export interface ExtensionConfig {
    config: IExtensionManifest | object;
    filesOrContents?: Map<string, string | URL>;
}

export interface WrapperConfig {
    id?: string;
    logLevel?: LogLevel | number;
    htmlContainer: HTMLElement;
    extensions?: ExtensionConfig[];
    vscodeApiConfig: VscodeApiConfig;
    editorAppConfig: EditorAppConfig;
    languageClientConfigs?: Record<string, LanguageClientConfig>;
}

export interface RegisterExtensionResult {
    id: string;
    dispose(): Promise<void>;
    whenReady(): Promise<void>;
}

export interface RegisterLocalExtensionResult extends RegisterExtensionResult {
    registerFileUrl: (path: string, url: string) => monaco.IDisposable;
}

export interface RegisterLocalProcessExtensionResult extends RegisterLocalExtensionResult {
    getApi(): Promise<typeof vscode>;
    setAsDefaultApi(): Promise<void>;
}

/**
 * This class is responsible for the overall ochestration.
 * It inits, start and disposes the editor apps and the language client (if configured) and provides
 * access to all required components.
 */
export class MonacoEditorLanguageClientWrapper {

    private id: string;
    private extensionRegisterResults: Map<string, RegisterLocalProcessExtensionResult | RegisterExtensionResult | undefined> = new Map();
    private subscriptions: DisposableStore = new DisposableStore();
    private editorApp?: EditorApp;
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
        if ((editorAppConfig.useDiffEditor ?? false) && !editorAppConfig.codeResources?.original) {
            throw new Error(`Use diff editor was used without a valid config. code: ${editorAppConfig.codeResources?.main} codeOriginal: ${editorAppConfig.codeResources?.original}`);
        }

        const viewServiceType = wrapperConfig.vscodeApiConfig.viewsConfig?.viewServiceType ?? 'EditorService';
        if ((viewServiceType === 'ViewsService' || viewServiceType === 'WorkspaceService') && editorAppConfig.$type === 'classic') {
            throw new Error(`View Service Type "${viewServiceType}" cannot be used with classic configuration.`);
        }

        // Always dispose old instances before start
        this.dispose(false);
        this.id = wrapperConfig.id ?? Math.floor(Math.random() * 101).toString();
        this.logger.setLevel(wrapperConfig.logLevel ?? LogLevel.Off);

        if (typeof wrapperConfig.editorAppConfig.monacoWorkerFactory === 'function') {
            wrapperConfig.editorAppConfig.monacoWorkerFactory(this.logger);
        }

        if (!(wrapperConfig.vscodeApiConfig.vscodeApiInitPerformExternally === true)) {
            wrapperConfig.vscodeApiConfig = await configureAndInitVscodeApi({
                vscodeApiConfig: wrapperConfig.vscodeApiConfig,
                logLevel: this.logger.getLevel(),
                // workaround for classic monaco-editor not applying semanticHighlighting
                semanticHighlighting: wrapperConfig.editorAppConfig.editorOptions?.['semanticHighlighting.enabled'] === true
            }, {
                htmlContainer: wrapperConfig.htmlContainer,
                caller: `monaco-editor (${this.id})`,
                performServiceConsistencyChecks: checkServiceConsistency,
                logger: this.logger
            });
        }

        const lccEntries = Object.entries(wrapperConfig.languageClientConfigs ?? {});
        if (lccEntries.length > 0) {
            for (const [languageId, lcc] of lccEntries) {
                const lcw = new LanguageClientWrapper({
                    languageClientConfig: lcc,
                    logger: this.logger
                });
                this.languageClientWrappers.set(languageId, lcw);
            }
        }

        this.initExtensions(wrapperConfig.vscodeApiConfig, wrapperConfig.extensions);

        this.editorApp = new EditorApp(this.id, wrapperConfig.editorAppConfig, this.logger);
        await this.editorApp.init();
        this.initDone = true;

        this.wrapperConfig = wrapperConfig;
    }

    protected async initExtensions(vscodeApiConfig: VscodeApiConfig, extensions?: ExtensionConfig[]) {
        if (vscodeApiConfig.loadThemes === true) {
            await import('@codingame/monaco-vscode-theme-defaults-default-extension');
        }

        if (extensions) {
            const allPromises: Array<Promise<void>> = [];
            for (const extensionConfig of extensions) {
                const manifest = extensionConfig.config as IExtensionManifest;
                const extRegResult = registerExtension(manifest, ExtensionHostKind.LocalProcess);
                this.extensionRegisterResults.set(manifest.name, extRegResult);
                if (extensionConfig.filesOrContents && Object.hasOwn(extRegResult, 'registerFileUrl')) {
                    for (const entry of extensionConfig.filesOrContents) {
                        const registerFileUrlResult = (extRegResult as RegisterLocalExtensionResult).registerFileUrl(entry[0], verifyUrlOrCreateDataUrl(entry[1]));
                        this.subscriptions.add(registerFileUrlResult);
                    }
                }
                allPromises.push(extRegResult.whenReady());
            }
            await Promise.all(allPromises);
        }
    }

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
    async dispose(disposeLanguageClients: boolean = true) {
        this.markStopping();

        this.editorApp?.disposeApp();
        this.editorApp = undefined;

        this.extensionRegisterResults.forEach((k) => k?.dispose());
        this.subscriptions.dispose();

        if (disposeLanguageClients) {
            await this.disposeLanguageClients();
        }

        this.initDone = false;
        this.markStopped();
    }

    async disposeLanguageClients() {
        const allPromises: Array<Promise<void>> = [];
        for (const lcw of this.languageClientWrappers.values()) {
            if (lcw.haveLanguageClient()) {
                allPromises.push(lcw.disposeLanguageClient(false));
            }
        }
        return Promise.all(allPromises);
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

export const configureAndInitVscodeApi = async (config: VscodeServicesConfig, initInstructions: InitServicesInstructions) => {
    const vscodeApiConfigAugmented = await augmentVscodeApiConfig(config);
    await initServices(vscodeApiConfigAugmented, initInstructions);
    return vscodeApiConfigAugmented;
};

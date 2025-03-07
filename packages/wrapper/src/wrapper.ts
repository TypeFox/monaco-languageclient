/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from '@codingame/monaco-vscode-editor-api';
import { DisposableStore } from '@codingame/monaco-vscode-api/monaco';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { registerExtension, type IExtensionManifest, ExtensionHostKind, type RegisterExtensionResult, getExtensionManifests } from '@codingame/monaco-vscode-api/extensions';
import { MonacoLanguageClient } from 'monaco-languageclient';
import { initServices, type VscodeApiConfig } from 'monaco-languageclient/vscode/services';
import { type Logger, ConsoleLogger } from 'monaco-languageclient/tools';
import { augmentVscodeApiConfig, checkServiceConsistency, type OverallConfigType } from './vscode/services.js';
import { type CodeResources, didModelContentChange, EditorApp, type EditorAppConfig, type ModelRefs, type TextContents, type TextModels, verifyUrlOrCreateDataUrl } from './editorApp.js';
import { type LanguageClientConfig, LanguageClientWrapper } from './languageClientWrapper.js';

export interface ExtensionConfig {
    config: IExtensionManifest;
    filesOrContents?: Map<string, string | URL>;
}

export interface LanguageClientConfigs {
    // default is true if not specified as it is optional
    automaticallyInit?: boolean;
    // default is true if not specified as it is optional
    automaticallyStart?: boolean;
    // default is true if not specified as it is optional
    automaticallyDispose?: boolean;
    // default is false if not specified as it is optional
    automaticallyDisposeWorkers?: boolean;
    configs: Record<string, LanguageClientConfig>
}

export interface WrapperConfig {
    $type: OverallConfigType;
    htmlContainer?: HTMLElement;
    id?: string;
    logLevel?: LogLevel | number;
    extensions?: ExtensionConfig[];
    vscodeApiConfig?: VscodeApiConfig;
    editorAppConfig?: EditorAppConfig;
    languageClientConfigs?: LanguageClientConfigs;
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
    private disposableStoreExtensions?: DisposableStore = new DisposableStore();
    private disposableStoreMonaco?: DisposableStore = new DisposableStore();
    private languageClientWrappers: Map<string, LanguageClientWrapper> = new Map();
    private wrapperConfig?: WrapperConfig;
    private logger: Logger = new ConsoleLogger();

    private initAwait?: Promise<void>;
    private initResolve: (value: void | PromiseLike<void>) => void;

    private startingAwait?: Promise<void>;
    private startingResolve: (value: void | PromiseLike<void>) => void;

    private disposingAwait?: Promise<void>;
    private disposingResolve: (value: void | PromiseLike<void>) => void;

    /**
     * Perform an isolated initialization of the user services and the languageclient wrapper (if used).
     */
    async init(wrapperConfig: WrapperConfig) {
        if (this.isInitializing()) {
            await this.getInitializingAwait();
        }

        // This will throw an error if not disposed before
        if (this.wrapperConfig !== undefined) {
            throw new Error('init was already performed. Please call dispose first if you want to re-start.');
        }
        const editorAppConfig = wrapperConfig.editorAppConfig;
        if ((editorAppConfig?.useDiffEditor ?? false) && !editorAppConfig?.codeResources?.original) {
            throw new Error(`Use diff editor was used without a valid config. code: ${editorAppConfig?.codeResources?.modified} codeOriginal: ${editorAppConfig?.codeResources?.original}`);
        }

        const viewServiceType = wrapperConfig.vscodeApiConfig?.viewsConfig?.viewServiceType ?? 'EditorService';
        if (wrapperConfig.$type === 'classic' && (viewServiceType === 'ViewsService' || viewServiceType === 'WorkspaceService')) {
            throw new Error(`View Service Type "${viewServiceType}" cannot be used with classic configuration.`);
        }

        this.markInitializing();

        try {
            this.id = wrapperConfig.id ?? Math.floor(Math.random() * 101).toString();

            this.logger.setLevel(wrapperConfig.logLevel ?? LogLevel.Off);
            if (typeof wrapperConfig.editorAppConfig?.monacoWorkerFactory === 'function') {
                wrapperConfig.editorAppConfig.monacoWorkerFactory(this.logger);
            }

            if (!(wrapperConfig.vscodeApiConfig?.vscodeApiInitPerformExternally === true)) {
                wrapperConfig.vscodeApiConfig = await augmentVscodeApiConfig(wrapperConfig.$type, {
                    vscodeApiConfig: wrapperConfig.vscodeApiConfig ?? {},
                    logLevel: this.logger.getLevel(),
                    // workaround for classic monaco-editor not applying semanticHighlighting
                    semanticHighlighting: wrapperConfig.editorAppConfig?.editorOptions?.['semanticHighlighting.enabled'] === true
                });
                await initServices(wrapperConfig.vscodeApiConfig, {
                    htmlContainer: wrapperConfig.htmlContainer,
                    caller: `monaco-editor (${this.id})`,
                    performServiceConsistencyChecks: checkServiceConsistency,
                    logger: this.logger
                });
            }

            this.wrapperConfig = wrapperConfig;
            if (this.wrapperConfig.languageClientConfigs?.automaticallyInit ?? true) {
                this.initLanguageClients();
            }
            await this.initExtensions();
            this.editorApp = new EditorApp(this.id, this.wrapperConfig.$type, this.wrapperConfig.editorAppConfig, this.logger);
            // eslint-disable-next-line no-useless-catch
        } catch (e) {
            throw e;
        } finally {
            // in case of rejection, mark as initialized, otherwise the promise will never resolve
            this.markInitialized();
        }
    }

    initLanguageClients() {
        const lccEntries = Object.entries(this.wrapperConfig?.languageClientConfigs?.configs ?? {});
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
            const extensionIds: string[] = [];
            getExtensionManifests().forEach((ext) => {
                extensionIds.push(ext.identifier.id);
            });
            for (const extensionConfig of extensions ?? []) {
                if (!extensionIds.includes(`${extensionConfig.config.publisher}.${extensionConfig.config.name}`)) {
                    const manifest = extensionConfig.config as IExtensionManifest;
                    const extRegResult = registerExtension(manifest, ExtensionHostKind.LocalProcess);
                    this.extensionRegisterResults.set(manifest.name, extRegResult);
                    if (extensionConfig.filesOrContents && Object.hasOwn(extRegResult, 'registerFileUrl')) {
                        for (const entry of extensionConfig.filesOrContents) {
                            this.disposableStoreExtensions?.add(extRegResult.registerFileUrl(entry[0], verifyUrlOrCreateDataUrl(entry[1])));
                        }
                    }
                    allPromises.push(extRegResult.whenReady());
                }
            }
            await Promise.all(allPromises);
        }
    };

    private markInitializing() {
        this.initAwait = new Promise<void>((resolve) => {
            this.initResolve = resolve;
        });
    }

    private markInitialized() {
        this.initResolve();
        this.initAwait = undefined;
    }

    isInitializing() {
        return this.initAwait !== undefined;
    }

    getInitializingAwait() {
        return this.initAwait;
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
        if (this.isStarting()) {
            await this.getStartingAwait();
        }

        if (this.wrapperConfig === undefined) {
            throw new Error('No init was performed. Please call init() before start()');
        }
        this.markStarting();
        try {
            const viewServiceType = this.wrapperConfig.vscodeApiConfig?.viewsConfig?.viewServiceType;
            if (viewServiceType === 'EditorService' || viewServiceType === undefined) {
                this.logger.info(`Starting monaco-editor (${this.id})`);
                const html = htmlContainer === undefined ? this.wrapperConfig.htmlContainer : htmlContainer;
                if (html === undefined) {
                    throw new Error('No html container provided. Unable to start monaco-editor.');
                } else {
                    await this.editorApp?.createEditors(html);
                }
            } else {
                this.logger.info('No EditorService configured. monaco-editor will not be started.');
            }

            if (this.wrapperConfig.languageClientConfigs?.automaticallyStart ?? true) {
                await this.startLanguageClients();
            }
            // eslint-disable-next-line no-useless-catch
        } catch (e) {
            throw e;
        } finally {
            // in case of rejection, mark as started, otherwise the promise will never resolve
            this.markStarted();
        }
    }

    async startLanguageClients(): Promise<void[]> {
        const allPromises: Array<Promise<void>> = [];
        for (const lcw of this.languageClientWrappers.values()) {
            allPromises.push(lcw.start());
        }
        return Promise.all(allPromises);
    }

    private markStarting() {
        this.startingAwait = new Promise<void>((resolve) => {
            this.startingResolve = resolve;
        });
    }

    private markStarted() {
        this.startingResolve();
        this.startingAwait = undefined;
    }

    isStarting() {
        return this.startingAwait !== undefined;
    }

    getStartingAwait() {
        return this.startingAwait;
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

    registerTextChangeCallback(onTextChanged?: (textChanges: TextContents) => void) {
        this.editorApp?.registerModelUpdate((textModels: TextModels) => {
            // clear on new registration
            this.disposableStoreMonaco?.clear();

            if (textModels.modified !== undefined || textModels.original !== undefined) {

                if (textModels.modified !== undefined) {
                    this.disposableStoreMonaco?.add(textModels.modified.onDidChangeContent(() => {
                        didModelContentChange(textModels, onTextChanged);
                    }));
                }

                if (textModels.original !== undefined) {
                    this.disposableStoreMonaco?.add(textModels.original.onDidChangeContent(() => {
                        didModelContentChange(textModels, onTextChanged);
                    }));
                }
                // do it initially
                didModelContentChange(textModels, onTextChanged);
            }
        });
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
    async dispose() {
        if (this.isDisposing()) {
            await this.getDisposingAwait();
        }
        this.markDisposing();

        this.editorApp?.disposeApp();
        this.editorApp = undefined;

        this.extensionRegisterResults.forEach((k) => k.dispose());
        this.disposableStoreExtensions?.dispose();
        this.disposableStoreMonaco?.dispose();

        // re-create disposable stores
        this.disposableStoreExtensions = new DisposableStore();
        this.disposableStoreMonaco = new DisposableStore();

        try {
            if (this.wrapperConfig?.languageClientConfigs?.automaticallyDispose ?? true) {
                await this.disposeLanguageClients();
            }
            // eslint-disable-next-line no-useless-catch
        } catch (e) {
            throw e;
        } finally {
            // in case of rejection, mark as stopped, otherwise the promise will never resolve
            this.languageClientWrappers.clear();
            this.wrapperConfig = undefined;
            this.markDisposed();
        }
    }

    async disposeLanguageClients() {
        const disposeWorker = this.wrapperConfig?.languageClientConfigs?.automaticallyDisposeWorkers ?? false;
        const allPromises: Array<Promise<void>> = [];
        for (const lcw of this.languageClientWrappers.values()) {
            if (lcw.haveLanguageClient()) {
                allPromises.push(lcw.disposeLanguageClient(disposeWorker));
            }
        }
        return Promise.all(allPromises);
    }

    private markDisposing() {
        this.disposingAwait = new Promise<void>((resolve) => {
            this.disposingResolve = resolve;
        });
    }

    private markDisposed() {
        this.disposingResolve();
        this.disposingAwait = undefined;
    }

    isDisposing() {
        return this.disposingAwait !== undefined;
    }

    getDisposingAwait() {
        return this.disposingAwait;
    }

    updateLayout() {
        this.editorApp?.updateLayout();
    }
}

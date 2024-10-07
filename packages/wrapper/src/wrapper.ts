/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor';
import { LogLevel } from 'vscode/services';
import { MonacoLanguageClient } from 'monaco-languageclient';
import { VscodeApiConfig, initServices } from 'monaco-languageclient/vscode/services';
import { Logger, ConsoleLogger } from 'monaco-languageclient/tools';
import { checkServiceConsistency, configureVscodeApi } from './vscode/services.js';
import { EditorAppConfigExtended, EditorAppExtended } from './editorAppExtended.js';
import { EditorAppClassic, EditorAppConfigClassic } from './editorAppClassic.js';
import { CodeResources, ModelRefs, TextContents, TextModels } from './editorAppBase.js';
import { LanguageClientConfig, LanguageClientWrapper } from './languageClientWrapper.js';
import { updateUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override';

export interface WrapperConfig {
    id?: string;
    logLevel?: LogLevel | number;
    vscodeApiConfig?: VscodeApiConfig;
    editorAppConfig: EditorAppConfigExtended | EditorAppConfigClassic;
    languageClientConfigs?: Record<string, LanguageClientConfig>;
}

/**
 * This class is responsible for the overall ochestration.
 * It inits, start and disposes the editor apps and the language client (if configured) and provides
 * access to all required components.
 */
export class MonacoEditorLanguageClientWrapper {

    private id: string;
    private editorApp: EditorAppClassic | EditorAppExtended | undefined;
    private languageClientWrappers: Map<string, LanguageClientWrapper> = new Map();
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

        const viewServiceType = wrapperConfig.vscodeApiConfig?.viewsConfig?.viewServiceType ?? 'EditorService';
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

        if (editorAppConfig.$type === 'classic') {
            this.editorApp = new EditorAppClassic(this.id, wrapperConfig.editorAppConfig as EditorAppConfigClassic, this.logger);
        } else {
            this.editorApp = new EditorAppExtended(this.id, wrapperConfig.editorAppConfig as EditorAppConfigExtended, this.logger);
        }

        // editorApps init their own service thats why they have to be created first
        const specificServices = await this.editorApp.specifyServices();
        const vscodeApiConfig = await configureVscodeApi({
            vscodeApiConfig: wrapperConfig.vscodeApiConfig ?? {},
            specificServices,
            logLevel: this.logger.getLevel(),
            // workaround for classic monaco-editor not applying semanticHighlighting
            semanticHighlighting: wrapperConfig.editorAppConfig.editorOptions?.['semanticHighlighting.enabled'] === true
        });
        wrapperConfig.vscodeApiConfig = vscodeApiConfig;
        await initServices({
            userServices: vscodeApiConfig.userServices,
            enableExtHostWorker: vscodeApiConfig.enableExtHostWorker,
            workspaceConfig: vscodeApiConfig.workspaceConfig,
            userConfiguration: vscodeApiConfig.userConfiguration,
            htmlContainer: editorAppConfig.htmlContainer,
            caller: `monaco-editor (${this.id})`,
            performChecks: checkServiceConsistency,
            logger: this.logger
        });

        await updateUserConfiguration(vscodeApiConfig.userConfiguration?.json ?? JSON.stringify({}));

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

        await this.editorApp.init();
        this.initDone = true;

        return wrapperConfig;
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
    async start() {
        if (!this.initDone) {
            throw new Error('No init was performed. Please call init() before start()');
        }

        this.logger.info(`Starting monaco-editor (${this.id})`);
        await this.editorApp?.createEditors();

        for (const lcw of this.languageClientWrappers.values()) {
            await lcw.start();
        }

        this.markStarted();
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

        if (disposeLanguageClients) {
            const allPromises: Array<Promise<void>> = [];
            for (const lcw of this.languageClientWrappers.values()) {
                if (lcw.haveLanguageClient()) {
                    allPromises.push(lcw.disposeLanguageClient(false));
                }
            }
            await Promise.all(allPromises);
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

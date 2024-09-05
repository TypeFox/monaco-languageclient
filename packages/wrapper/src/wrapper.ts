/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor';
import { MonacoLanguageClient } from 'monaco-languageclient';
import { initServices } from 'monaco-languageclient/vscode/services';
import { Logger } from 'monaco-languageclient/tools';
import { checkServiceConsistency, configureServices } from './vscode/services.js';
import { EditorAppExtended } from './editorAppExtended.js';
import { EditorAppClassic } from './editorAppClassic.js';
import { CodeResources, ModelRefs, TextContents, TextModels } from './editorAppBase.js';
import { LanguageClientWrapper } from './languageClientWrapper.js';
import { UserConfig } from './userConfig.js';

/**
 * This class is responsible for the overall ochestration.
 * It inits, start and disposes the editor apps and the language client (if configured) and provides
 * access to all required components.
 */
export class MonacoEditorLanguageClientWrapper {

    private id: string;
    private editorApp: EditorAppClassic | EditorAppExtended | undefined;
    private languageClientWrappers: Map<string, LanguageClientWrapper> = new Map();
    private logger: Logger = new Logger();
    private initDone = false;
    private starting?: Promise<void>;
    private startAwait: (value: void | PromiseLike<void>) => void;
    private stopping?: Promise<void>;
    private stopAwait: (value: void | PromiseLike<void>) => void;

    /**
     * Perform an isolated initialization of the user services and the languageclient wrapper (if used).
     */
    async init(userConfig: UserConfig) {
        this.markStarting();
        if (this.initDone) {
            throw new Error('init was already performed. Please call dispose first if you want to re-start.');
        }

        const editorAppConfig = userConfig.wrapperConfig.editorAppConfig;
        if ((editorAppConfig.useDiffEditor ?? false) && !editorAppConfig.codeResources?.original) {
            throw new Error(`Use diff editor was used without a valid config. code: ${editorAppConfig.codeResources?.main} codeOriginal: ${editorAppConfig.codeResources?.original}`);
        }

        // Always dispose old instances before start
        this.dispose(false);
        this.id = userConfig.id ?? Math.floor(Math.random() * 101).toString();
        this.logger.updateConfig(userConfig.loggerConfig);

        if (editorAppConfig.$type === 'classic') {
            this.editorApp = new EditorAppClassic(this.id, userConfig, this.logger);
        } else {
            this.editorApp = new EditorAppExtended(this.id, userConfig, this.logger);
        }

        // editorApps init their own service thats why they have to be created first
        const specificServices = await this.editorApp.specifyServices();
        const serviceConfig = await configureServices({
            serviceConfig: userConfig.wrapperConfig.serviceConfig,
            specificServices,
            logger: this.logger
        });
        await initServices({
            serviceConfig,
            caller: `monaco-editor (${this.id})`,
            performChecks: checkServiceConsistency,
            logger: this.logger
        });

        const lccs = userConfig.languageClientConfigs;
        if (lccs !== undefined && Object.entries(lccs).length > 0) {

            for (const [languageId, lcc] of Object.entries(lccs)) {
                const lcw = new LanguageClientWrapper({
                    languageClientConfig: lcc,
                    logger: this.logger
                });
                this.languageClientWrappers.set(languageId, lcw);
            }
        }

        this.initDone = true;
    }

    /**
     * Performs a full user configuration and the languageclient wrapper (if used) init and then start the application.
     */
    async initAndStart(userConfig: UserConfig, htmlElement: HTMLElement | null) {
        await this.init(userConfig);
        await this.start(htmlElement);
    }

    /**
     * Does not perform any user configuration or other application init and just starts the application.
     */
    async start(htmlElement: HTMLElement | null) {
        if (!this.initDone) {
            throw new Error('No init was performed. Please call init() before start()');
        }
        if (!htmlElement) {
            throw new Error('No HTMLElement provided for monaco-editor.');
        }

        this.logger.info(`Starting monaco-editor (${this.id})`);
        await this.editorApp?.init();
        await this.editorApp?.createEditors(htmlElement);

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
    async dispose(disposeLanguageClients: boolean = true): Promise<void> {
        this.markStopping();

        this.editorApp?.disposeApp();

        if (disposeLanguageClients) {
            for (const lcw of this.languageClientWrappers.values()) {
                if (lcw.haveLanguageClient()) {
                    await lcw.disposeLanguageClient(false);
                }
                this.editorApp = undefined;
                await Promise.resolve('Monaco editor and languageclient completed disposed.');
            }
        } else {
            await Promise.resolve('Monaco editor has been disposed.');
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

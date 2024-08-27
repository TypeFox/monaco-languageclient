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
    private languageClientWrapper?: LanguageClientWrapper;
    private logger: Logger = new Logger();
    private initDone = false;

    /**
     * Perform an isolated initialization of the user services and the languageclient wrapper (if used).
     */
    async init(userConfig: UserConfig) {
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

        if (userConfig.languageClientConfig) {
            this.languageClientWrapper = new LanguageClientWrapper();
            await this.languageClientWrapper.init({
                languageClientConfig: userConfig.languageClientConfig,
                logger: this.logger
            });
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

        if (this.languageClientWrapper?.haveLanguageClientConfig() ?? false) {
            await this.languageClientWrapper?.start();
        }
    }

    public isInitDone() {
        return this.initDone;
    }

    isStarted(): boolean {
        // fast-fail
        if (!(this.editorApp?.haveEditor() ?? false)) {
            return false;
        }

        if (this.languageClientWrapper?.haveLanguageClient() ?? false) {
            return this.languageClientWrapper?.isStarted() ?? false;
        }
        return true;
    }

    haveLanguageClient(): boolean {
        return this.languageClientWrapper !== undefined;
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

    getLanguageClientWrapper(): LanguageClientWrapper | undefined {
        return this.languageClientWrapper;
    }

    getLanguageClient(): MonacoLanguageClient | undefined {
        return this.languageClientWrapper?.getLanguageClient();
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

    getWorker(): Worker | undefined {
        return this.languageClientWrapper?.getWorker();
    }

    async updateCodeResources(codeResources?: CodeResources): Promise<void> {
        return this.editorApp?.updateCodeResources(codeResources);
    }

    updateEditorModels(modelRefs: ModelRefs) {
        this.editorApp?.updateEditorModels(modelRefs);
    }

    public reportStatus() {
        const status: string[] = [];
        status.push('Wrapper status:');
        status.push(`Editor: ${this.editorApp?.getEditor()?.getId()}`);
        status.push(`DiffEditor: ${this.editorApp?.getDiffEditor()?.getId()}`);
        return status;
    }

    /**
     * Disposes all application and editor resources, plus the languageclient (if used).
     */
    async dispose(disposeLanguageClient: boolean = true): Promise<void> {
        this.editorApp?.disposeApp();

        if ((disposeLanguageClient && this.languageClientWrapper?.haveLanguageClient()) ?? false) {
            await this.languageClientWrapper?.disposeLanguageClient(false);
            this.editorApp = undefined;
            await Promise.resolve('Monaco editor and languageclient completed disposed.');
        }
        else {
            await Promise.resolve('Monaco editor has been disposed.');
        }
        this.initDone = false;
    }

    updateLayout() {
        this.editorApp?.updateLayout();
    }

}

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { editor, Uri } from 'monaco-editor';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import { InitializeServiceConfig, MonacoLanguageClient, mergeServices } from 'monaco-languageclient';
import { EditorAppExtended, EditorAppConfigExtended } from './editorAppExtended.js';
import { EditorAppClassic, EditorAppConfigClassic } from './editorAppClassic.js';
import { ModelUpdate } from './editorAppBase.js';
import { LanguageClientConfig, LanguageClientWrapper } from './languageClientWrapper.js';
import { Logger, LoggerConfig } from './logger.js';

export type WrapperConfig = {
    serviceConfig?: InitializeServiceConfig;
    editorAppConfig: EditorAppConfigExtended | EditorAppConfigClassic;
};

export type UserConfig = {
    id?: string;
    loggerConfig?: LoggerConfig;
    wrapperConfig: WrapperConfig;
    languageClientConfig?: LanguageClientConfig;
}

/**
 * This class is responsible for the overall ochestration.
 * It inits, start and disposes the editor apps and the language client (if configured) and provides
 * access to all required components.
 */
export class MonacoEditorLanguageClientWrapper {

    private id: string;

    private editorApp: EditorAppClassic | EditorAppExtended | undefined;
    private languageClientWrapper?: LanguageClientWrapper;
    private logger: Logger;
    private initDone = false;

    /**
     * Perform an isolated initialization of the user services and the languageclient wrapper (if used).
     */
    async init(userConfig: UserConfig) {
        if (this.initDone) {
            throw new Error('init was already performed. Please call dispose first if you want to re-start.');
        }
        if (userConfig.wrapperConfig.editorAppConfig.useDiffEditor && !userConfig.wrapperConfig.editorAppConfig.codeOriginal) {
            throw new Error('Use diff editor was used without a valid config.');
        }
        // Always dispose old instances before start
        this.editorApp?.disposeApp();

        this.id = userConfig.id ?? Math.floor(Math.random() * 101).toString();
        this.logger = new Logger(userConfig.loggerConfig);
        const serviceConfig: InitializeServiceConfig = userConfig.wrapperConfig.serviceConfig ?? {};
        if (userConfig.wrapperConfig.editorAppConfig.$type === 'classic') {
            this.editorApp = new EditorAppClassic(this.id, userConfig, this.logger);
        } else {
            this.editorApp = new EditorAppExtended(this.id, userConfig, this.logger);
        }

        // editorApps init their own service thats why they have to be created first
        this.configureServices(serviceConfig);

        this.languageClientWrapper = new LanguageClientWrapper();
        await this.languageClientWrapper.init({
            languageId: this.editorApp.getConfig().languageId,
            serviceConfig,
            languageClientConfig: userConfig.languageClientConfig,
            logger: this.logger
        });

        this.initDone = true;
    }

    /**
     * Child classes are allow to override the services configuration implementation.
     */
    protected configureServices(serviceConfig: InitializeServiceConfig) {
        // always set required services if not configured
        serviceConfig.userServices = serviceConfig.userServices ?? {};
        const configureService = serviceConfig.userServices.configurationService ?? undefined;
        const workspaceConfig = serviceConfig.workspaceConfig ?? undefined;

        if (!configureService) {
            const mlcDefautServices = {
                ...getConfigurationServiceOverride()
            };
            mergeServices(mlcDefautServices, serviceConfig.userServices);

            if (workspaceConfig) {
                throw new Error('You provided a workspaceConfig without using the configurationServiceOverride');
            }
        }
        // adding the default workspace config if not provided
        if (!workspaceConfig) {
            serviceConfig.workspaceConfig = {
                workspaceProvider: {
                    trusted: true,
                    workspace: {
                        workspaceUri: Uri.file('/workspace')
                    },
                    async open() {
                        return false;
                    }
                }
            };
        }
        mergeServices(this.editorApp?.specifyServices() ?? {}, serviceConfig.userServices);

        // overrule debug log flag
        serviceConfig.debugLogging = this.logger.isEnabled() && (serviceConfig.debugLogging || this.logger.isDebugEnabled());
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

        if (this.languageClientWrapper?.haveLanguageClientConfig()) {
            await this.languageClientWrapper.start();
        }
    }

    isStarted(): boolean {
        // fast-fail
        if (!this.editorApp?.haveEditor()) {
            return false;
        }

        if (this.languageClientWrapper?.haveLanguageClient()) {
            return this.languageClientWrapper.isStarted();
        }
        return true;
    }

    getMonacoEditorApp() {
        return this.editorApp;
    }

    getEditor(): editor.IStandaloneCodeEditor | undefined {
        return this.editorApp?.getEditor();
    }

    getDiffEditor(): editor.IStandaloneDiffEditor | undefined {
        return this.editorApp?.getDiffEditor();
    }

    getLanguageClientWrapper(): LanguageClientWrapper | undefined {
        return this.languageClientWrapper;
    }

    getLanguageClient(): MonacoLanguageClient | undefined {
        return this.languageClientWrapper?.getLanguageClient();
    }

    getModel(original?: boolean): editor.ITextModel | undefined {
        return this.editorApp?.getModel(original);
    }

    getWorker(): Worker | undefined {
        return this.languageClientWrapper?.getWorker();
    }

    async updateModel(modelUpdate: ModelUpdate): Promise<void> {
        await this.editorApp?.updateModel(modelUpdate);
    }

    async updateDiffModel(modelUpdate: ModelUpdate): Promise<void> {
        await this.editorApp?.updateDiffModel(modelUpdate);
    }

    public reportStatus() {
        const status: string[] = [];
        status.push('Wrapper status:');
        status.push(`Editor: ${this.editorApp?.getEditor()}`);
        status.push(`DiffEditor: ${this.editorApp?.getDiffEditor()}`);
        return status;
    }

    /**
     * Disposes all application and editor resources, plus the languageclient (if used).
     */
    async dispose(): Promise<void> {
        this.editorApp?.disposeApp();

        if (this.languageClientWrapper?.haveLanguageClient()) {
            await this.languageClientWrapper.disposeLanguageClient(false);
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

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from '@codingame/monaco-vscode-editor-api';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { type Logger, ConsoleLogger } from 'monaco-languageclient/common';
import { getEnhancedMonacoEnvironment } from 'monaco-languageclient/vscodeApiWrapper';
import { type CodeResources, EditorApp, type TextContents, type TextModels } from './editorApp.js';
import type { WrapperConfig } from './config.js';

/**
 * This class is responsible for the overall ochestration.
 * It inits, start and disposes the editor apps and the language client (if configured) and provides
 * access to all required components.
 */
export class MonacoEditorLanguageClientWrapper {

    private id: string;
    private editorApp?: EditorApp;

    private logger: Logger = new ConsoleLogger();
    private wrapperConfig?: WrapperConfig;

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
        try {
            this.markInitializing();

            const editorAppConfig = wrapperConfig.editorAppConfig;
            if ((editorAppConfig?.useDiffEditor ?? false) && !editorAppConfig?.codeResources?.original) {
                throw new Error(`Use diff editor was used without a valid config. code: ${editorAppConfig?.codeResources?.modified} codeOriginal: ${editorAppConfig?.codeResources?.original}`);
            }

            this.wrapperConfig = wrapperConfig;
            this.id = this.wrapperConfig.id ?? Math.floor(Math.random() * 1000001).toString();
            this.logger.setLevel(this.wrapperConfig.logLevel ?? LogLevel.Off);

            this.editorApp = new EditorApp(this.wrapperConfig.$type, this.id, this.wrapperConfig.editorAppConfig, this.logger);
            await this.editorApp.init();
            // eslint-disable-next-line no-useless-catch
        } catch (e) {
            throw e;
        } finally {
            // in case of rejection, mark as initialized, otherwise the promise will never resolve
            this.markInitialized();
        }
    }

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

    /**
     * Performs a full user configuration and the languageclient wrapper (if used) init and then start the application.
     */
    async initAndStart(wrapperConfig: WrapperConfig, htmlContainer: HTMLElement) {
        await this.init(wrapperConfig);
        await this.start(htmlContainer);
    }

    /**
     * Does not perform any user configuration or other application init and just starts the application.
     */
    async start(htmlContainer: HTMLElement) {
        if (this.isStarting()) {
            await this.getStartingAwait();
        }

        if (this.wrapperConfig === undefined) {
            throw new Error('No init was performed. Please call init() before start()');
        }
        this.markStarting();
        try {
            const envEnhanced = getEnhancedMonacoEnvironment();
            const viewServiceType = envEnhanced.viewServiceType;
            if (viewServiceType === 'EditorService' || viewServiceType === undefined) {
                this.logger.info(`Starting monaco-editor (${this.id})`);
                await this.editorApp?.createEditors(htmlContainer!);
            } else {
                this.logger.info('No EditorService configured. monaco-editor will not be started.');
            }
            // eslint-disable-next-line no-useless-catch
        } catch (e) {
            throw e;
        } finally {
            // in case of rejection, mark as started, otherwise the promise will never resolve
            this.markStarted();
        }
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
        return this.editorApp?.haveEditor() ?? false;
    }

    getEditorApp() {
        return this.editorApp;
    }

    getEditor(): monaco.editor.IStandaloneCodeEditor | undefined {
        return this.editorApp?.getEditor();
    }

    getDiffEditor(): monaco.editor.IStandaloneDiffEditor | undefined {
        return this.editorApp?.getDiffEditor();
    }

    getTextModels(): TextModels | undefined {
        return this.editorApp?.getTextModels();
    }

    getLogger() {
        return this.logger;
    }

    async updateCodeResources(codeResources?: CodeResources): Promise<void> {
        return this.editorApp?.updateCodeResources(codeResources);
    }

    registerTextChangedCallback(onTextChanged?: (textChanges: TextContents) => void) {
        this.editorApp?.registerOnTextChangedCallbacks(onTextChanged);
    }

    updateLayout() {
        this.editorApp?.updateLayout();
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

        await this.editorApp?.dispose();
        this.editorApp = undefined;

        this.markDisposed();
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

}

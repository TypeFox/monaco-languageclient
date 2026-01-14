/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ConfigurationTarget, IConfigurationService, LogLevel, StandaloneServices } from '@codingame/monaco-vscode-api';
import { createModelReference, type ITextFileEditorModel } from '@codingame/monaco-vscode-api/monaco';
import * as monaco from '@codingame/monaco-vscode-editor-api';
import type { IReference } from '@codingame/monaco-vscode-editor-service-override';
import type { ILogger } from '@codingame/monaco-vscode-log-service-override';
import { ConsoleLogger } from '@codingame/monaco-vscode-log-service-override';
import { getEnhancedMonacoEnvironment } from 'monaco-languageclient/vscodeApiWrapper';
import * as vscode from 'vscode';
import type { CallbackDisposeable, CodeContent, CodeResources, DisposableModelRefs, EditorAppConfig, TextContents, TextModels } from './config.js';
import { ModelRefs } from './config.js';

/**
 * This is the base class for both Monaco Editor Apps:
 * - EditorAppClassic
 * - EditorAppExtended
 *
 * It provides the generic functionality for both implementations.
 */
export class EditorApp {

    private id: string;
    private config: EditorAppConfig;

    protected logger: ILogger = new ConsoleLogger();

    private editor: monaco.editor.IStandaloneCodeEditor | undefined;
    private diffEditor: monaco.editor.IStandaloneDiffEditor | undefined;

    private modelRefs: ModelRefs = new ModelRefs();

    private onTextChanged?: (textChanges: TextContents) => void;
    private textChangedDisposables: CallbackDisposeable = {};
    private modelDisposables: DisposableModelRefs = {};

    private modelRefDisposeTimeout = -1;

    private startingAwait?: Promise<void>;

    private disposingAwait?: Promise<void>;

    constructor(userAppConfig?: EditorAppConfig) {
        this.id = userAppConfig?.id ?? Math.floor(Math.random() * 1000001).toString();
        if ((userAppConfig?.useDiffEditor ?? false) && !userAppConfig?.codeResources?.original) {
            throw new Error(`Use diff editor was used without a valid config. code: ${userAppConfig?.codeResources?.modified} codeOriginal: ${userAppConfig?.codeResources?.original}`);
        }
        this.config = {
            codeResources: userAppConfig?.codeResources ?? undefined,
            useDiffEditor: userAppConfig?.useDiffEditor ?? false,
            readOnly: userAppConfig?.readOnly ?? false,
            domReadOnly: userAppConfig?.domReadOnly ?? false,
            overrideAutomaticLayout: userAppConfig?.overrideAutomaticLayout ?? true
        };
        this.config.editorOptions = {
            ...userAppConfig?.editorOptions,
            automaticLayout: userAppConfig?.overrideAutomaticLayout ?? true
        };
        this.config.diffEditorOptions = {
            ...userAppConfig?.diffEditorOptions,
            automaticLayout: userAppConfig?.overrideAutomaticLayout ?? true
        };
        this.config.languageDef = userAppConfig?.languageDef;
        this.config.logLevel = userAppConfig?.logLevel ?? LogLevel.Off;

        this.logger.setLevel(this.config.logLevel);
    }

    isDiffEditor() {
        return this.config.useDiffEditor === true;
    }

    getConfig(): EditorAppConfig {
        return this.config;
    }

    getEditor(): monaco.editor.IStandaloneCodeEditor | undefined {
        return this.editor;
    }

    getDiffEditor(): monaco.editor.IStandaloneDiffEditor | undefined {
        return this.diffEditor;
    }

    getTextModels(): TextModels {
        return {
            modified: this.modelRefs.modified?.object.textEditorModel ?? undefined,
            original: this.modelRefs.original?.object.textEditorModel ?? undefined
        };
    }

    registerOnTextChangedCallback(onTextChanged?: (textChanges: TextContents) => void) {
        this.onTextChanged = onTextChanged;
    }

    public setModelRefDisposeTimeout(modelRefDisposeTimeout: number) {
        this.modelRefDisposeTimeout = modelRefDisposeTimeout;
    }

    isStarting() {
        return this.startingAwait !== undefined;
    }

    getStartingAwait() {
        return this.startingAwait;
    }

    isStarted() {
        return this.editor !== undefined || this.diffEditor !== undefined;
    }

    /**
     * Starts the single editor application.
     */
    async start(htmlContainer: HTMLElement) {
        if (this.isStarting()) {
            await this.getStartingAwait();
        }

        let startingResolve: (value: void | PromiseLike<void>) => void = () => { };
        this.startingAwait = new Promise<void>((resolve) => {
            startingResolve = resolve;
        });

        try {
            const envEnhanced = getEnhancedMonacoEnvironment();
            const viewServiceType = envEnhanced.viewServiceType;

            // check general error case first
            if (!(envEnhanced.vscodeApiInitialised ?? false)) {
                return Promise.reject('monaco-vscode-api was not initialized. Aborting.');
            }
            if (viewServiceType !== 'EditorService' && viewServiceType !== undefined) {
                return Promise.reject('No EditorService configured. monaco-editor will not be started.');
            }
            if (!this.isDisposed()) {
                return Promise.reject('Start was called without properly disposing the EditorApp first.');
            }

            const languageDef = this.config.languageDef;
            if (languageDef) {
                // register own language first
                monaco.languages.register(languageDef.languageExtensionConfig);

                const languageRegistered = monaco.languages.getLanguages().filter(x => x.id === languageDef.languageExtensionConfig.id);
                if (languageRegistered.length === 0) {
                    // this is only meaningful for languages supported by monaco out of the box
                    monaco.languages.register({
                        id: languageDef.languageExtensionConfig.id
                    });
                }

                // apply monarch definitions
                if (languageDef.monarchLanguage) {
                    monaco.languages.setMonarchTokensProvider(languageDef.languageExtensionConfig.id, languageDef.monarchLanguage);
                }

                if (languageDef.theme) {
                    monaco.editor.defineTheme(languageDef.theme.name, languageDef.theme.data);
                    monaco.editor.setTheme(languageDef.theme.name);
                }
            }

            if (this.config.editorOptions?.['semanticHighlighting.enabled'] !== undefined) {
                StandaloneServices.get(IConfigurationService).updateValue('editor.semanticHighlighting.enabled',
                    this.config.editorOptions['semanticHighlighting.enabled'], ConfigurationTarget.USER);
            }

            await this.createEditors(htmlContainer);

            // everything is fine at this point
            startingResolve();
            this.logger.info('EditorApp start completed successfully.');
        } catch (e) {
            // in case of further errors (after general ones above)
            // take the error and build a new rejection to complete the promise
            return Promise.reject(e);
        } finally {
            this.startingAwait = undefined;
        }
    }

    async createEditors(htmlContainer: HTMLElement): Promise<void> {
        // ensure proper default resources are initialized, uris have to be unique
        const modified = {
            text: this.config.codeResources?.modified?.text ?? '',
            uri: this.config.codeResources?.modified?.uri ?? `default-uri-modified-${this.id}`,
            enforceLanguageId: this.config.codeResources?.modified?.enforceLanguageId ?? undefined
        };
        this.modelRefs.modified = await this.buildModelReference(modified);

        if (this.isDiffEditor()) {
            const original = {
                text: this.config.codeResources?.original?.text ?? '',
                uri: this.config.codeResources?.original?.uri ?? `default-uri-original-${this.id}`,
                enforceLanguageId: this.config.codeResources?.original?.enforceLanguageId ?? undefined
            };
            this.modelRefs.original = await this.buildModelReference(original);
        }

        this.logger.info(`Starting monaco-editor (${this.id})`);
        if (this.isDiffEditor()) {
            this.diffEditor = monaco.editor.createDiffEditor(htmlContainer, this.config.diffEditorOptions);
            const modified = this.modelRefs.modified.object.textEditorModel ?? undefined;
            const original = this.modelRefs.original?.object.textEditorModel ?? undefined;
            if (modified !== undefined && original !== undefined) {
                const model = {
                    modified,
                    original
                };
                this.diffEditor.setModel(model);
                this.announceModelUpdate(model);
            }
        } else {
            const model = {
                modified: this.modelRefs.modified.object.textEditorModel
            };
            this.editor = monaco.editor.create(htmlContainer, {
                ...this.config.editorOptions,
                model: model.modified
            });
            this.announceModelUpdate(model);
        }
    }

    updateCode(code: { modified?: string, original?: string }) {
        if (this.isDiffEditor()) {
            if (code.modified !== undefined) {
                this.diffEditor?.getModifiedEditor().setValue(code.modified);
            }
            if (code.original !== undefined) {
                this.diffEditor?.getOriginalEditor().setValue(code.original);
            }
        } else {
            if (code.modified !== undefined) {
                this.editor?.setValue(code.modified);
            }

        }
    }

    async updateCodeResources(codeResources?: CodeResources): Promise<boolean> {
        let updateModified = false;
        let updateOriginal = false;
        let updated = false;

        if (codeResources?.modified !== undefined && codeResources.modified.uri !== this.modelRefs.modified?.object.resource.path) {
            this.modelDisposables.modified = this.modelRefs.modified;
            this.modelRefs.modified = await this.buildModelReference(codeResources.modified);
            updateModified = true;
        }
        if (codeResources?.original !== undefined && codeResources.original.uri !== this.modelRefs.original?.object.resource.path) {
            this.modelDisposables.original = this.modelRefs.original;
            this.modelRefs.original = await this.buildModelReference(codeResources.original);
            updateOriginal = true;
        }

        if (this.isDiffEditor()) {
            if (updateModified || updateOriginal) {
                const modified = this.modelRefs.modified?.object.textEditorModel ?? undefined;
                const original = this.modelRefs.original?.object.textEditorModel ?? undefined;
                if (modified !== undefined && original !== undefined) {
                    const model = {
                        modified,
                        original
                    };
                    this.diffEditor?.setModel(model);
                    this.announceModelUpdate(model);
                    await this.disposeModelRefs();
                    updated = true;
                }
            } else {
                this.logger.info('Diff Editor: Code resources were not updated. They are ether unchanged or undefined.');
            }
        } else {
            if (updateModified) {
                const model = {
                    modified: this.modelRefs.modified?.object.textEditorModel
                };
                if (model.modified !== undefined && model.modified !== null) {
                    this.editor?.setModel(model.modified);
                    this.announceModelUpdate(model);
                    await this.disposeModelRefs();
                    updated = true;
                }
            } else {
                this.logger.info('Editor: Code resources were not updated. They are either unchanged or undefined.');
            }
        }
        return updated;
    }

    async buildModelReference(codeContent: CodeContent): Promise<IReference<ITextFileEditorModel>> {
        const code = codeContent.text;
        const modelRef = await createModelReference(vscode.Uri.parse(codeContent.uri), code);

        // update the text if different
        if (modelRef.object.textEditorModel?.getValue() !== code) {
            modelRef.object.textEditorModel?.setValue(code);
        }
        const enforceLanguageId = codeContent.enforceLanguageId;
        if (enforceLanguageId !== undefined) {
            modelRef.object.setLanguageId(enforceLanguageId);
            this.logger.info(`Main languageId is enforced: ${enforceLanguageId}`);
        }
        return modelRef;
    };

    private announceModelUpdate(textModels: TextModels) {
        if (this.onTextChanged !== undefined) {
            let changed = false;
            if (textModels.modified !== undefined && textModels.modified !== null) {
                const old = this.textChangedDisposables.modified;
                this.textChangedDisposables.modified = textModels.modified.onDidChangeContent(() => {
                    didModelContentChange(textModels, this.onTextChanged);
                });
                old?.dispose();
                changed = true;
            }

            if (textModels.original !== undefined && textModels.original !== null) {
                const old = this.textChangedDisposables.original;
                this.textChangedDisposables.original = textModels.original.onDidChangeContent(() => {
                    didModelContentChange(textModels, this.onTextChanged);
                });
                old?.dispose();
                changed = true;
            }

            if (changed) {
                // do it initially
                didModelContentChange(textModels, this.onTextChanged);
            }
        }
    }

    async dispose() {
        if (this.isDisposing()) {
            await this.getDisposingAwait();
        }
        let disposingResolve: (value: void | PromiseLike<void>) => void = () => { };
        this.disposingAwait = new Promise<void>((resolve) => {
            disposingResolve = resolve;
        });

        if (this.editor) {
            this.editor.dispose();
            this.editor = undefined;
        }
        if (this.diffEditor) {
            this.diffEditor.dispose();
            this.diffEditor = undefined;
        }

        this.textChangedDisposables.modified?.dispose();
        this.textChangedDisposables.original?.dispose();
        this.textChangedDisposables.modified = undefined;
        this.textChangedDisposables.original = undefined;

        await this.disposeModelRefs();

        disposingResolve();
        this.disposingAwait = undefined;
    }

    isDisposed(): boolean {
        return this.editor === undefined && this.diffEditor === undefined &&
            this.modelDisposables.original === undefined && this.modelDisposables.modified === undefined;
    }

    isDisposing() {
        return this.disposingAwait !== undefined;
    }

    getDisposingAwait() {
        return this.disposingAwait;
    }

    async disposeModelRefs() {
        const disposeRefs = () => {
            if (this.logger.getLevel() === LogLevel.Debug) {
                const models = monaco.editor.getModels();
                this.logger.debug('Current model URIs:');
                models.forEach((model, _index) => {
                    this.logger.debug(`${model.uri.toString()}`);
                });
            }

            if (this.modelDisposables.modified !== undefined && !this.modelDisposables.modified.object.isDisposed()) {
                this.modelDisposables.modified.dispose();
                this.modelDisposables.modified = undefined;
            }
            if (this.modelDisposables.original !== undefined && !this.modelDisposables.original.object.isDisposed()) {
                this.modelDisposables.original.dispose();
                this.modelDisposables.original = undefined;
            }

            if (this.logger.getLevel() === LogLevel.Debug) {
                if (this.modelDisposables.modified === undefined && this.modelDisposables.original === undefined) {
                    this.logger.debug('All model references are disposed.');
                } else {
                    this.logger.debug('Model references are still available.');
                }
            }
        };

        if (this.modelRefDisposeTimeout > 0) {
            this.logger.debug('Using async dispose of model references');
            await new Promise<void>(resolve => setTimeout(() => {
                disposeRefs();
                resolve();
            }, this.modelRefDisposeTimeout));
        } else {
            disposeRefs();
        }
    }

    updateLayout(dimension?: monaco.editor.IDimension, postponeRendering?: boolean) {
        if (this.isDiffEditor()) {
            this.diffEditor?.layout(dimension, postponeRendering);
        } else {
            this.editor?.layout(dimension, postponeRendering);
        }
    }

    reportStatus() {
        const status: string[] = [];
        status.push('EditorApp status:');
        status.push(`Editor: ${this.editor?.getId()}`);
        status.push(`DiffEditor: ${this.diffEditor?.getId()}`);
        return status;
    }
}

export const didModelContentChange = (textModels: TextModels, onTextChanged?: (textChanges: TextContents) => void) => {
    const modified = textModels.modified?.getValue() ?? '';
    const original = textModels.original?.getValue() ?? '';
    onTextChanged?.({
        modified,
        original
    });
};

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import * as monaco from '@codingame/monaco-vscode-editor-api';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { createModelReference, type ITextFileEditorModel } from '@codingame/monaco-vscode-api/monaco';
import { ConfigurationTarget, IConfigurationService, StandaloneServices } from '@codingame/monaco-vscode-api';
import type { IReference } from '@codingame/monaco-vscode-editor-service-override';
import type { Logger } from 'monaco-languageclient/tools';
import type { OverallConfigType } from './vscode/services.js';

export interface ModelRefs {
    modified: IReference<ITextFileEditorModel>;
    original?: IReference<ITextFileEditorModel>;
}

export interface TextModels {
    modified?: monaco.editor.ITextModel | null;
    original?: monaco.editor.ITextModel | null;
}

export interface TextContents {
    modified?: string;
    original?: string;
}

export interface CodeContent {
    text: string;
    uri: string;
    enforceLanguageId?: string;
}

export interface CodeResources {
    modified?: CodeContent;
    original?: CodeContent;
}

export interface CallbackDisposeable {
    modified?: monaco.IDisposable;
    original?: monaco.IDisposable;
}

export interface DisposableModelRefs {
    modified?: IReference<ITextFileEditorModel>;
    original?: IReference<ITextFileEditorModel>;
}

export interface EditorAppConfig {
    codeResources?: CodeResources;
    useDiffEditor?: boolean;
    domReadOnly?: boolean;
    readOnly?: boolean;
    overrideAutomaticLayout?: boolean;
    editorOptions?: monaco.editor.IStandaloneEditorConstructionOptions;
    diffEditorOptions?: monaco.editor.IStandaloneDiffEditorConstructionOptions;
    monacoWorkerFactory?: (logger?: Logger) => void;
    languageDef?: {
        languageExtensionConfig: monaco.languages.ILanguageExtensionPoint;
        monarchLanguage?: monaco.languages.IMonarchLanguage;
        theme?: {
            name: monaco.editor.BuiltinTheme | string;
            data: monaco.editor.IStandaloneThemeData;
        }
    }
}

/**
 * This is the base class for both Monaco Ediotor Apps:
 * - EditorAppClassic
 * - EditorAppExtended
 *
 * It provides the generic functionality for both implementations.
 */
export class EditorApp {

    private $type: OverallConfigType;
    private id: string;
    private config: EditorAppConfig;
    protected logger: Logger | undefined;

    private editor: monaco.editor.IStandaloneCodeEditor | undefined;
    private diffEditor: monaco.editor.IStandaloneDiffEditor | undefined;

    private modelRefs: ModelRefs;

    private onTextChanged?: (textChanges: TextContents) => void;
    private textChangedDiposeables: CallbackDisposeable = {};
    private modelDisposables: DisposableModelRefs = {};

    private modelRefDisposeTimeout = -1;

    constructor($type: OverallConfigType, id: string, userAppConfig?: EditorAppConfig, logger?: Logger) {
        this.$type = $type;
        this.id = id;
        this.logger = logger;
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
    }

    async init(): Promise<void> {
        const languageDef = this.config.languageDef;
        if (languageDef) {
            if (this.$type === 'extended') {
                throw new Error('Language definition is not supported for extended editor apps where textmate is used.');
            }
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

        // ensure proper default resources are initialized, uris have to be unique
        const modified = {
            text: this.config.codeResources?.modified?.text ?? '',
            uri: this.config.codeResources?.modified?.uri ?? `default-uri-modified-${this.id}`,
            enforceLanguageId: this.config.codeResources?.modified?.enforceLanguageId ?? undefined
        };
        this.modelRefs = {
            modified: await this.buildModelReference(modified, this.logger)
        };

        if (this.config.useDiffEditor === true) {
            const original = {
                text: this.config.codeResources?.original?.text ?? '',
                uri: this.config.codeResources?.original?.uri ?? `default-uri-original-${this.id}`,
                enforceLanguageId: this.config.codeResources?.original?.enforceLanguageId ?? undefined
            };
            this.modelRefs.original = await this.buildModelReference(original, this.logger);
        }

        this.logger?.info('Init of EditorApp was completed.');
    }

    getConfig(): EditorAppConfig {
        return this.config;
    }

    haveEditor() {
        return this.editor !== undefined || this.diffEditor !== undefined;
    }

    getEditor(): monaco.editor.IStandaloneCodeEditor | undefined {
        return this.editor;
    }

    getDiffEditor(): monaco.editor.IStandaloneDiffEditor | undefined {
        return this.diffEditor;
    }

    async createEditors(htmlContainer: HTMLElement): Promise<void> {
        if (this.config.useDiffEditor === true) {
            this.diffEditor = monaco.editor.createDiffEditor(htmlContainer, this.config.diffEditorOptions);
            this.diffEditor.setModel({
                modified: this.modelRefs.modified.object.textEditorModel!,
                original: this.modelRefs.original!.object.textEditorModel!
            });

            this.announceModelUpdate({
                modified: this.modelRefs.modified.object.textEditorModel,
                original: this.modelRefs.original!.object.textEditorModel!
            });
        } else {
            this.editor = monaco.editor.create(htmlContainer, {
                ...this.config.editorOptions,
                model: this.modelRefs.modified.object.textEditorModel
            });

            this.announceModelUpdate({
                modified: this.modelRefs.modified.object.textEditorModel
            });
        }
    }

    async updateCodeResources(codeResources?: CodeResources): Promise<void> {
        let updateModified = false;
        let updateOriginal = false;

        if (codeResources?.modified !== undefined && codeResources.modified.uri !== this.modelRefs.modified.object.resource.path) {
            this.modelDisposables.modified = this.modelRefs.modified;
            this.modelRefs.modified = await this.buildModelReference(codeResources.modified, this.logger);
            updateModified = true;
        }
        if (codeResources?.original !== undefined && codeResources.original.uri !== this.modelRefs.original?.object.resource.path) {
            this.modelDisposables.original = this.modelRefs.original;
            this.modelRefs.original = await this.buildModelReference(codeResources.original, this.logger);
            updateOriginal = true;
        }

        // only update if all reaquired models are available
        if (this.config.useDiffEditor === true) {
            if (updateModified && updateOriginal) {
                this.diffEditor?.setModel({
                    modified: this.modelRefs.modified.object.textEditorModel!,
                    original: this.modelRefs.original!.object.textEditorModel!
                });

                this.announceModelUpdate({
                    modified: this.modelRefs.modified.object.textEditorModel,
                    original: this.modelRefs.original!.object.textEditorModel!
                });
            } else {
                this.logger?.info('Diff Editor: Code resources were not updated. Either unchanged or undefined.');
            }
        } else {
            if (updateModified) {
                this.editor?.setModel(this.modelRefs.modified.object.textEditorModel);

                this.announceModelUpdate({
                    modified: this.modelRefs.modified.object.textEditorModel
                });
            } else {
                this.logger?.info('Editor: Code resources were not updated. Either unchanged or undefined.');
            }
        }

        await this.disposeModelRefs();
    }

    async dispose() {
        if (this.editor) {
            this.editor.dispose();
            this.editor = undefined;
        }
        if (this.diffEditor) {
            this.diffEditor.dispose();
            this.diffEditor = undefined;
        }

        this.textChangedDiposeables.modified?.dispose();
        this.textChangedDiposeables.original?.dispose();

        await this.disposeModelRefs();
    }

    async disposeModelRefs() {
        const diposeRefs = () => {
            if (this.logger?.getLevel() === LogLevel.Debug) {
                const models = monaco.editor.getModels();
                this.logger.debug('Current model URIs:');
                models.forEach((model, _index) => {
                    this.logger?.debug(`${model.uri.toString()}`);
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
            if (this.modelDisposables.modified === undefined && this.modelDisposables.original === undefined) {
                this.logger?.debug('All model references are disposed.');
            } else {
                this.logger?.debug('Model references are still available.');
            }
        };

        if (this.modelRefDisposeTimeout > 0) {
            this.logger?.debug('Using async dispose of model references');
            await new Promise<void>(resolve => setTimeout(() => {
                diposeRefs();
                resolve();
            }, this.modelRefDisposeTimeout));
        } else {
            diposeRefs();
        }
    }

    getTextContents(): TextContents {
        return {
            modified: this.modelRefs.modified.object.textEditorModel?.getValue() ?? undefined,
            original: this.modelRefs.original?.object.textEditorModel?.getValue() ?? undefined
        };
    }

    getTextModels(): TextModels {
        return {
            modified: this.modelRefs.modified.object.textEditorModel,
            original: this.modelRefs.original?.object.textEditorModel ?? undefined
        };
    }

    registerOnTextChangedCallbacks(onTextChanged?: (textChanges: TextContents) => void) {
        this.onTextChanged = onTextChanged;
    }

    public setModelRefDisposeTimeout(modelRefDisposeTimeout: number) {
        this.modelRefDisposeTimeout = modelRefDisposeTimeout;
    }

    private announceModelUpdate(textModels: TextModels) {
        if (this.onTextChanged !== undefined) {
            let changed = false;
            if (textModels.modified !== undefined && textModels.modified !== null) {
                const old = this.textChangedDiposeables.modified;
                this.textChangedDiposeables.modified = textModels.modified.onDidChangeContent(() => {
                    didModelContentChange(textModels, this.onTextChanged);
                });
                old?.dispose();
                changed = true;
            }

            if (textModels.original !== undefined && textModels.original !== null) {
                const old = this.textChangedDiposeables.original;
                this.textChangedDiposeables.original = textModels.original.onDidChangeContent(() => {
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

    updateLayout() {
        if (this.config.useDiffEditor ?? false) {
            this.diffEditor?.layout();
        } else {
            this.editor?.layout();
        }
    }

    updateMonacoEditorOptions(options: monaco.editor.IEditorOptions & monaco.editor.IGlobalEditorOptions) {
        this.getEditor()?.updateOptions(options);
    }

    async buildModelReference(codeContent: CodeContent, logger?: Logger): Promise<IReference<ITextFileEditorModel>> {
        const code = codeContent.text;
        const modelRef = await createModelReference(vscode.Uri.parse(codeContent.uri), code);

        // update the text if different
        if (modelRef.object.textEditorModel?.getValue() !== code) {
            modelRef.object.textEditorModel?.setValue(code);
        }
        const enforceLanguageId = codeContent.enforceLanguageId;
        if (enforceLanguageId !== undefined) {
            modelRef.object.setLanguageId(enforceLanguageId);
            logger?.info(`Main languageId is enforced: ${enforceLanguageId}`);
        }
        return modelRef;
    };

}

export const verifyUrlOrCreateDataUrl = (input: string | URL) => {
    if (input instanceof URL) {
        return input.href;
    } else {
        const bytes = new TextEncoder().encode(input);
        const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join('');
        const base64 = btoa(binString);
        return new URL(`data:text/plain;base64,${base64}`).href;
    }
};

export const didModelContentChange = (textModels: TextModels, onTextChanged?: (textChanges: TextContents) => void) => {
    const modified = textModels.modified?.getValue() ?? '';
    const original = textModels.original?.getValue() ?? '';
    onTextChanged?.({
        modified,
        original
    });
};

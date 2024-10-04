/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor';
import { createModelReference, ITextFileEditorModel } from 'vscode/monaco';
import { IReference } from '@codingame/monaco-vscode-editor-service-override';
import { Logger } from 'monaco-languageclient/tools';
import { getEditorUri, isModelUpdateRequired, ModelUpdateType } from './utils.js';

export interface CodeContent {
    text: string;
    enforceLanguageId?: string;
}

export interface CodePlusUri extends CodeContent {
    uri: string;
}

export interface CodePlusFileExt extends CodeContent {
    fileExt: string;
}

export interface CodeResources {
    main?: CodePlusUri | CodePlusFileExt;
    original?: CodePlusUri | CodePlusFileExt;
}

export type EditorAppType = 'extended' | 'classic';

export interface EditorAppConfigBase {
    $type: EditorAppType;
    htmlContainer: HTMLElement;
    codeResources?: CodeResources;
    useDiffEditor?: boolean;
    domReadOnly?: boolean;
    readOnly?: boolean;
    overrideAutomaticLayout?: boolean;
    editorOptions?: monaco.editor.IStandaloneEditorConstructionOptions;
    diffEditorOptions?: monaco.editor.IStandaloneDiffEditorConstructionOptions;
    monacoWorkerFactory?: (logger: Logger) => void;
}

export interface ModelRefs {
    modelRef?: IReference<ITextFileEditorModel>;
    modelRefOriginal?: IReference<ITextFileEditorModel>;
}

export interface TextModels {
    text?: monaco.editor.ITextModel;
    textOriginal?: monaco.editor.ITextModel;
}

export interface TextContents {
    text?: string;
    textOriginal?: string;
}

/**
 * This is the base class for both Monaco Ediotor Apps:
 * - EditorAppClassic
 * - EditorAppExtended
 *
 * It provides the generic functionality for both implementations.
 */
export abstract class EditorAppBase {

    private id: string;
    protected logger: Logger | undefined;

    private editor: monaco.editor.IStandaloneCodeEditor | undefined;
    private diffEditor: monaco.editor.IStandaloneDiffEditor | undefined;

    private modelRef: IReference<ITextFileEditorModel> | undefined;
    private modelRefOriginal: IReference<ITextFileEditorModel> | undefined;

    constructor(id: string, logger?: Logger) {
        this.id = id;
        this.logger = logger;
    }

    protected buildConfig(userAppConfig: EditorAppConfigBase): EditorAppConfigBase {
        const config: EditorAppConfigBase = {
            $type: userAppConfig.$type,
            htmlContainer: userAppConfig.htmlContainer,
            codeResources: userAppConfig.codeResources,
            useDiffEditor: userAppConfig.useDiffEditor ?? false,
            readOnly: userAppConfig.readOnly ?? false,
            domReadOnly: userAppConfig.domReadOnly ?? false,
            overrideAutomaticLayout: userAppConfig.overrideAutomaticLayout ?? true
        };
        config.editorOptions = {
            ...userAppConfig.editorOptions,
            automaticLayout: userAppConfig.overrideAutomaticLayout ?? true
        };
        config.diffEditorOptions = {
            ...userAppConfig.diffEditorOptions,
            automaticLayout: userAppConfig.overrideAutomaticLayout ?? true
        };
        return config;
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

    async createEditors(): Promise<void> {
        if (this.getConfig().useDiffEditor ?? false) {
            this.diffEditor = monaco.editor.createDiffEditor(this.getConfig().htmlContainer, this.getConfig().diffEditorOptions);
        } else {
            this.editor = monaco.editor.create(this.getConfig().htmlContainer, this.getConfig().editorOptions);
        }

        const modelRefs = await this.buildModelRefs(this.getConfig().codeResources);
        this.updateEditorModels(modelRefs);
    }

    protected disposeEditors() {
        if (this.editor) {
            this.modelRef?.dispose();
            this.editor.dispose();
            this.editor = undefined;
        }
        if (this.diffEditor) {
            this.modelRef?.dispose();
            this.modelRefOriginal?.dispose();
            this.diffEditor.dispose();
            this.diffEditor = undefined;
        }
    }

    getTextContents(): TextContents {
        const modelRefs = this.getModelRefs();
        return {
            text: modelRefs.modelRef?.object.textEditorModel?.getValue() ?? undefined,
            textOriginal: modelRefs.modelRefOriginal?.object.textEditorModel?.getValue() ?? undefined
        };
    }

    getTextModels(): TextModels {
        const modelRefs = this.getModelRefs();
        return {
            text: modelRefs.modelRef?.object.textEditorModel ?? undefined,
            textOriginal: modelRefs.modelRefOriginal?.object.textEditorModel ?? undefined
        };
    }

    getModelRefs(): ModelRefs {
        return {
            modelRef: this.modelRef,
            modelRefOriginal: this.modelRefOriginal
        };
    }

    async updateCodeResources(codeResources?: CodeResources): Promise<void> {
        const modelUpdateType = isModelUpdateRequired(this.getConfig().codeResources, codeResources);
        if (modelUpdateType !== ModelUpdateType.NONE) {
            this.updateCodeResourcesConfig(codeResources);
        }

        if (modelUpdateType === ModelUpdateType.CODE) {
            if (this.editor) {
                this.editor.setValue(codeResources?.main?.text ?? '');
            } else {
                this.diffEditor?.getModifiedEditor().setValue(codeResources?.main?.text ?? '');
                this.diffEditor?.getOriginalEditor().setValue(codeResources?.original?.text ?? '');
            }
        } else if (modelUpdateType === ModelUpdateType.MODEL || modelUpdateType === ModelUpdateType.CODE_AND_MODEL) {
            const modelRefs = await this.buildModelRefs(codeResources);
            this.updateEditorModels(modelRefs);
        }
        return Promise.resolve();
    }

    async buildModelRefs(codeResources?: CodeResources): Promise<ModelRefs> {
        const modelRef = await this.buildModelRef(codeResources?.main, false);
        const modelRefOriginal = await this.buildModelRef(codeResources?.original, true);

        return {
            modelRef,
            modelRefOriginal
        };
    }

    private async buildModelRef(code?: CodePlusUri | CodePlusFileExt, original?: boolean): Promise<IReference<ITextFileEditorModel> | undefined> {
        if (code) {
            const uri = getEditorUri(this.id, original ?? false, code);
            const modelRef = await createModelReference(uri, code.text);
            this.checkEnforceLanguageId(modelRef, code.enforceLanguageId);
            return modelRef;
        }
        return undefined;
    }

    updateEditorModels(modelRefs: ModelRefs) {
        let updateMain = false;
        let updateOriginal = false;

        if (modelRefs.modelRef) {
            this.modelRef?.dispose();
            this.modelRef = modelRefs.modelRef;
            updateMain = true;
        }
        if (modelRefs.modelRefOriginal) {
            this.modelRefOriginal?.dispose();
            this.modelRefOriginal = modelRefs.modelRefOriginal;
            updateOriginal = true;
        }

        if (this.editor) {
            if (updateMain && this.modelRef && this.modelRef.object.textEditorModel !== null) {
                this.editor.setModel(this.modelRef.object.textEditorModel);
            }
        } else if (this.diffEditor) {
            if ((updateMain || updateOriginal) &&
                this.modelRef && this.modelRefOriginal &&
                this.modelRef.object.textEditorModel !== null && this.modelRefOriginal.object.textEditorModel !== null) {
                this.diffEditor.setModel({
                    original: this.modelRefOriginal.object.textEditorModel,
                    modified: this.modelRef.object.textEditorModel
                });
            } else {
                throw new Error('You cannot update models, because original model ref is not contained, but required for DiffEditor.');
            }
        }
    }

    private checkEnforceLanguageId(modelRef: IReference<ITextFileEditorModel>, enforceLanguageId?: string) {
        if (enforceLanguageId !== undefined) {
            modelRef.object.setLanguageId(enforceLanguageId);
            this.logger?.info(`Main languageId is enforced: ${enforceLanguageId}`);
        }
    }

    private updateCodeResourcesConfig(codeResources?: CodeResources) {
        const config = this.getConfig();
        // reset first, if the passed resources are empty, then the new resources will be empty as well
        config.codeResources = {};
        if (codeResources?.main) {
            config.codeResources.main = codeResources.main;
        }
        if (codeResources?.original) {
            config.codeResources.original = codeResources.original;
        }
    }

    updateLayout() {
        if (this.getConfig().useDiffEditor ?? false) {
            this.diffEditor?.layout();
        } else {
            this.editor?.layout();
        }
    }

    updateMonacoEditorOptions(options: monaco.editor.IEditorOptions & monaco.editor.IGlobalEditorOptions) {
        this.getEditor()?.updateOptions(options);
    }

    abstract updateHtmlContainer(htmlContainer: HTMLElement): void;
    abstract loadUserConfiguration(): Promise<void>;
    abstract init(): Promise<void>;
    abstract specifyServices(): Promise<monaco.editor.IEditorOverrideServices>;
    abstract getConfig(): EditorAppConfigBase;
    abstract disposeApp(): void;
    abstract isAppConfigDifferent(orgConfig: EditorAppConfigBase, config: EditorAppConfigBase, includeModelData: boolean): boolean;
}

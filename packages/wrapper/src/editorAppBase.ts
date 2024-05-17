/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor';
import { createModelReference, ITextFileEditorModel } from 'vscode/monaco';
import { IReference } from '@codingame/monaco-vscode-editor-service-override';
import { getUserConfiguration, updateUserConfiguration as vscodeUpdateUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override';
import { getEditorUri, isModelUpdateRequired, ModelUpdateType } from './utils.js';
import { Logger } from 'monaco-languageclient/tools';

export type CodeContent = {
    text: string;
    enforceLanguageId?: string;
}

export type CodePlusUri = CodeContent & {
    uri: string;
}

export type CodePlusFileExt = CodeContent & {
    fileExt: string;
}

export type CodeResources = {
    main?: CodePlusUri | CodePlusFileExt;
    original?: CodePlusUri | CodePlusFileExt;
}

export type EditorAppType = 'extended' | 'classic';

export type EditorAppConfigBase = {
    $type: EditorAppType;
    codeResources: CodeResources;
    useDiffEditor: boolean;
    domReadOnly?: boolean;
    readOnly?: boolean;
    awaitExtensionReadiness?: Array<() => Promise<void>>;
    overrideAutomaticLayout?: boolean;
    editorOptions?: monaco.editor.IStandaloneEditorConstructionOptions;
    diffEditorOptions?: monaco.editor.IStandaloneDiffEditorConstructionOptions;
}

export type ModelRefs = {
    modelRef?: IReference<ITextFileEditorModel>;
    modelRefOriginal?: IReference<ITextFileEditorModel>;
}

export type TextModels = {
    text?: monaco.editor.ITextModel;
    textOriginal?: monaco.editor.ITextModel;
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
            codeResources: userAppConfig.codeResources,
            useDiffEditor: userAppConfig.useDiffEditor === true,
            readOnly: userAppConfig.readOnly ?? false,
            domReadOnly: userAppConfig.domReadOnly ?? false,
            overrideAutomaticLayout: userAppConfig.overrideAutomaticLayout ?? true,
            awaitExtensionReadiness: userAppConfig.awaitExtensionReadiness ?? undefined,
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

    async createEditors(container: HTMLElement): Promise<void> {
        if (this.getConfig().useDiffEditor) {
            this.diffEditor = monaco.editor.createDiffEditor(container, this.getConfig().diffEditorOptions);
        } else {
            this.editor = monaco.editor.create(container, this.getConfig().editorOptions);
        }

        const modelRefs = await this.buildModelRefs(this.getConfig().codeResources);
        await this.updateEditorModels(modelRefs);
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

    async updateCodeResources(codeResources: CodeResources): Promise<void> {
        if (!this.editor && !this.diffEditor) {
            return Promise.reject(new Error('You cannot update the code resources as neither editor or diff editor is available.'));
        }

        const modelUpdateType = isModelUpdateRequired(this.getConfig().codeResources, codeResources);
        if (modelUpdateType !== ModelUpdateType.NONE) {
            this.updateCodeResourcesConfig(codeResources);
        }

        if (modelUpdateType === ModelUpdateType.CODE) {
            if (this.editor) {
                this.editor.setValue(codeResources.main?.text ?? '');
            } else {
                this.diffEditor?.getModifiedEditor().setValue(codeResources.main?.text ?? '');
                this.diffEditor?.getOriginalEditor().setValue(codeResources.original?.text ?? '');
            }
        } else if (modelUpdateType === ModelUpdateType.MODEL || modelUpdateType === ModelUpdateType.CODE_AND_MODEL) {
            const modelRefs = await this.buildModelRefs(codeResources);
            this.updateEditorModels(modelRefs);
        }
    }

    async buildModelRefs(codeResources: CodeResources): Promise<ModelRefs> {
        const modelRef = await this.buildModelRef(codeResources.main);
        const modelRefOriginal = await this.buildModelRef(codeResources.original);

        return {
            modelRef,
            modelRefOriginal
        };
    }

    private async buildModelRef(code?: CodePlusUri | CodePlusFileExt): Promise<IReference<ITextFileEditorModel> | undefined> {
        if (code) {
            const uri = getEditorUri(this.id, false, code);
            if (uri) {
                const modelRef = await createModelReference(uri, code?.text);
                this.checkEnforceLanguageId(modelRef, code.enforceLanguageId);
                return modelRef;
            }
        }
        return undefined;
    }

    async updateEditorModels(modelRefs: ModelRefs): Promise<void> {
        if (!this.editor && !this.diffEditor) {
            return Promise.reject(new Error('You cannot update models as neither editor nor diff editor is available.'));
        }
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
                return Promise.reject(new Error('You cannot update models, because original model ref is not contained, but required for DiffEditor.'));
            }
        }
    }

    private checkEnforceLanguageId(modelRef: IReference<ITextFileEditorModel>, enforceLanguageId?: string) {
        if (enforceLanguageId && modelRef) {
            modelRef?.object.setLanguageId(enforceLanguageId);
            this.logger?.info(`Main languageId is enforced: ${enforceLanguageId}`);
        }
    }

    private updateCodeResourcesConfig(codeResources: CodeResources) {
        const config = this.getConfig();
        config.codeResources.main = codeResources.main;
        config.codeResources.original = codeResources.original;
    }

    updateLayout() {
        if (this.getConfig().useDiffEditor) {
            this.diffEditor?.layout();
        } else {
            this.editor?.layout();
        }
    }

    async awaitReadiness(awaitExtensionReadiness?: Array<() => Promise<void>>) {
        if (awaitExtensionReadiness) {
            const allPromises: Array<Promise<void>> = [];
            for (const awaitReadiness of awaitExtensionReadiness) {
                allPromises.push(awaitReadiness());
            }
            return Promise.all(allPromises);
        }
        return Promise.resolve();
    }

    updateMonacoEditorOptions(options: monaco.editor.IEditorOptions & monaco.editor.IGlobalEditorOptions) {
        this.getEditor()?.updateOptions(options);
    }

    async updateUserConfiguration(json?: string) {
        if (json) {
            return vscodeUpdateUserConfiguration(json);
        }
        return Promise.resolve();
    }

    getUserConfiguration(): Promise<string> {
        return getUserConfiguration();
    }

    abstract init(): Promise<void>;
    abstract specifyServices(): Promise<monaco.editor.IEditorOverrideServices>;
    abstract getConfig(): EditorAppConfigBase;
    abstract disposeApp(): void;
    abstract isAppConfigDifferent(orgConfig: EditorAppConfigBase, config: EditorAppConfigBase, includeModelData: boolean): boolean;
}

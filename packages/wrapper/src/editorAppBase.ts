/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import * as monaco from 'monaco-editor';
import { createModelReference, ITextFileEditorModel } from 'vscode/monaco';
import { IReference } from '@codingame/monaco-vscode-editor-service-override';
import { Logger } from 'monaco-languageclient/tools';

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
    monacoWorkerFactory?: (logger?: Logger) => void;
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

export type TextChanges = TextContents & {
    isDirty: boolean;
    isDirtyOriginal: boolean;
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

    private modelUpdateCallback?: (textModels: TextModels) => void;

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

    registerModelUpdate(modelUpdateCallback: (textModels: TextModels) => void) {
        this.modelUpdateCallback = modelUpdateCallback;
    }

    async updateCodeResources(codeResources?: CodeResources): Promise<void> {
        const modelRefs = await this.buildModelRefs(codeResources);
        this.updateEditorModels(modelRefs);
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
                const textModels = {
                    text: this.modelRef.object.textEditorModel
                };
                this.editor.setModel(textModels.text);
                this.modelUpdateCallback?.(textModels);
            }
        } else if (this.diffEditor) {
            if ((updateMain || updateOriginal) &&
                this.modelRef && this.modelRefOriginal &&
                this.modelRef.object.textEditorModel !== null && this.modelRefOriginal.object.textEditorModel !== null) {
                const textModels = {
                    original: this.modelRefOriginal.object.textEditorModel,
                    modified: this.modelRef.object.textEditorModel
                };
                this.diffEditor.setModel(textModels);
                this.modelUpdateCallback?.({
                    textOriginal: textModels.original,
                    text: textModels.modified
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
    abstract init(): Promise<void>;
    abstract specifyServices(): Promise<monaco.editor.IEditorOverrideServices>;
    abstract getConfig(): EditorAppConfigBase;
    abstract disposeApp(): void;

}

export const verifyUrlOrCreateDataUrl = (input: string | URL) => {
    return (input instanceof URL) ? input.href : new URL(`data:text/plain;base64,${btoa(input)}`).href;
};

export const getEditorUri = (id: string, original: boolean, code: CodePlusUri | CodePlusFileExt, basePath?: string) => {
    if (Object.hasOwn(code, 'uri')) {
        return vscode.Uri.parse((code as CodePlusUri).uri);
    } else {
        return vscode.Uri.parse(`${basePath ?? '/workspace'}/model${original ? 'Original' : ''}${id}.${(code as CodePlusFileExt).fileExt}`);
    }
};

export const didModelContentChange = (textModels: TextModels, codeResources?: CodeResources, onTextChanged?: (textChanges: TextChanges) => void) => {
    const text = textModels.text?.getValue() ?? '';
    const textOriginal = textModels.textOriginal?.getValue() ?? '';
    const isDirty = text !== codeResources?.main?.text;
    const isDirtyOriginal = textOriginal !== codeResources?.original?.text;
    onTextChanged?.({
        text,
        textOriginal,
        isDirty,
        isDirtyOriginal
    });
};

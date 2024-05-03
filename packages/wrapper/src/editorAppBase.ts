/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import * as monaco from 'monaco-editor';
import { createModelReference, ITextFileEditorModel } from 'vscode/monaco';
import { IReference } from '@codingame/monaco-vscode-editor-service-override';
import { updateUserConfiguration as vscodeUpdateUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override';
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
    private modelOriginalRef: IReference<ITextFileEditorModel> | undefined;

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
            await this.updateDiffEditorModel();
        } else {
            this.editor = monaco.editor.create(container, this.getConfig().editorOptions);
            await this.updateEditorModel();
        }
    }

    protected disposeEditor() {
        if (this.editor) {
            this.modelRef?.dispose();
            this.editor.dispose();
            this.editor = undefined;
        }
    }

    protected disposeDiffEditor() {
        if (this.diffEditor) {
            this.modelRef?.dispose();
            this.modelOriginalRef?.dispose();
            this.diffEditor.dispose();
            this.diffEditor = undefined;
        }
    }

    getModel(original?: boolean): monaco.editor.ITextModel | undefined {
        if (this.getConfig().useDiffEditor) {
            return ((original === true) ? this.modelOriginalRef?.object.textEditorModel : this.modelRef?.object.textEditorModel) ?? undefined;
        } else {
            return this.modelRef?.object.textEditorModel ?? undefined;
        }
    }

    async updateModel(modelUpdate: CodeResources): Promise<void> {
        if (!this.editor) {
            return Promise.reject(new Error('You cannot update the editor model, because the regular editor is not configured.'));
        }

        const modelUpdateType = isModelUpdateRequired(this.getConfig().codeResources, modelUpdate);

        if (modelUpdateType === ModelUpdateType.CODE) {
            this.updateAppConfig(modelUpdate);
            if (this.getConfig().useDiffEditor) {
                this.diffEditor?.getModifiedEditor().setValue(modelUpdate.main?.text ?? '');
                this.diffEditor?.getOriginalEditor().setValue(modelUpdate.original?.text ?? '');
            } else {
                this.editor.setValue(modelUpdate.main?.text ?? '');
            }
        } else if (modelUpdateType === ModelUpdateType.MODEL) {
            this.updateAppConfig(modelUpdate);
            await this.updateEditorModel();
        }
        return Promise.resolve();
    }

    private async updateEditorModel(): Promise<void> {
        const config = this.getConfig();
        this.modelRef?.dispose();

        const codeResources = config.codeResources;
        const uri: vscode.Uri = getEditorUri(this.id, false, codeResources.main);
        this.modelRef = await createModelReference(uri, codeResources.main?.text) as unknown as IReference<ITextFileEditorModel>;
        this.checkEnforceLanguageId(this.modelRef, codeResources.main?.enforceLanguageId);

        if (this.editor) {
            this.editor.setModel(this.modelRef.object.textEditorModel);
        }
    }

    async updateDiffModel(codeResources: CodeResources): Promise<void> {
        if (!this.diffEditor) {
            return Promise.reject(new Error('You cannot update the diff editor models, because the diffEditor is not configured.'));
        }
        if (isModelUpdateRequired(this.getConfig().codeResources, codeResources)) {
            this.updateAppConfig(codeResources);
            await this.updateDiffEditorModel();
        }
        return Promise.resolve();
    }

    private async updateDiffEditorModel(): Promise<void> {
        const config = this.getConfig();
        this.modelRef?.dispose();
        this.modelOriginalRef?.dispose();

        const codeResources = config.codeResources;
        const uri: vscode.Uri = getEditorUri(this.id, false, codeResources.main);
        const uriOriginal: vscode.Uri = getEditorUri(this.id, true, codeResources.original);

        const promises = [];
        promises.push(createModelReference(uri, codeResources.main?.text));
        promises.push(createModelReference(uriOriginal, codeResources.original?.text));

        const refs = await Promise.all(promises);
        this.modelRef = refs[0] as unknown as IReference<ITextFileEditorModel>;
        this.modelOriginalRef = refs[1] as unknown as IReference<ITextFileEditorModel>;

        this.checkEnforceLanguageId(this.modelRef, codeResources.main?.enforceLanguageId);
        this.checkEnforceLanguageId(this.modelOriginalRef, codeResources.original?.enforceLanguageId);

        if (this.diffEditor && this.modelRef.object.textEditorModel !== null && this.modelOriginalRef.object.textEditorModel !== null) {
            this.diffEditor?.setModel({
                original: this.modelOriginalRef!.object!.textEditorModel,
                modified: this.modelRef!.object!.textEditorModel
            });
        }
    }

    private checkEnforceLanguageId(modelRef: IReference<ITextFileEditorModel>, enforceLanguageId?: string) {
        if (enforceLanguageId && modelRef) {
            modelRef?.object.setLanguageId(enforceLanguageId);
            this.logger?.info(`Main languageId is enforced: ${enforceLanguageId}`);
        }
    }

    private updateAppConfig(codeResources: CodeResources) {
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

    abstract init(): Promise<void>;
    abstract specifyServices(): Promise<monaco.editor.IEditorOverrideServices>;
    abstract getConfig(): EditorAppConfigBase;
    abstract disposeApp(): void;
    abstract isAppConfigDifferent(orgConfig: EditorAppConfigBase, config: EditorAppConfigBase, includeModelData: boolean): boolean;
}

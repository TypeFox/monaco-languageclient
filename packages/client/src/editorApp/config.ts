/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import { type ITextFileEditorModel } from '@codingame/monaco-vscode-api/monaco';
import * as monaco from '@codingame/monaco-vscode-editor-api';
import type { IReference } from '@codingame/monaco-vscode-editor-service-override';

export class ModelRefs {
    modified?: IReference<ITextFileEditorModel>;
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
    id?: string;
    logLevel?: LogLevel | number;
    codeResources?: CodeResources;
    useDiffEditor?: boolean;
    domReadOnly?: boolean;
    readOnly?: boolean;
    overrideAutomaticLayout?: boolean;
    editorOptions?: monaco.editor.IStandaloneEditorConstructionOptions;
    diffEditorOptions?: monaco.editor.IStandaloneDiffEditorConstructionOptions;
    languageDef?: {
        languageExtensionConfig: monaco.languages.ILanguageExtensionPoint;
        monarchLanguage?: monaco.languages.IMonarchLanguage;
        theme?: {
            name: monaco.editor.BuiltinTheme | string;
            data: monaco.editor.IStandaloneThemeData;
        }
    }
}

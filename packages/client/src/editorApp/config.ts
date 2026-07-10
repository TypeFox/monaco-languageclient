/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import { type ITextFileEditorModel } from '@codingame/monaco-vscode-api/monaco';
import type { editor, languages, IDisposable } from '@codingame/monaco-vscode-editor-api';
import type { IReference } from '@codingame/monaco-vscode-editor-service-override';

export class ModelRefs {
  modified?: IReference<ITextFileEditorModel>;
  original?: IReference<ITextFileEditorModel>;
}

export interface TextModels {
  modified?: editor.ITextModel | null;
  original?: editor.ITextModel | null;
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
  modified?: IDisposable;
  original?: IDisposable;
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
  editorOptions?: editor.IStandaloneEditorConstructionOptions;
  diffEditorOptions?: editor.IStandaloneDiffEditorConstructionOptions;
  languageDef?: {
    languageExtensionConfig: languages.ILanguageExtensionPoint;
    monarchLanguage?: languages.IMonarchLanguage;
    theme?: {
      name: string;
      data: editor.IStandaloneThemeData;
    };
  };
}

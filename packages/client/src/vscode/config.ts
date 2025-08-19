/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from '@codingame/monaco-vscode-editor-api';
import { LogLevel } from '@codingame/monaco-vscode-api';
import type { IWorkbenchConstructionOptions } from '@codingame/monaco-vscode-api';
import type { IExtensionManifest } from '@codingame/monaco-vscode-api/extensions';
import type { EnvironmentOverride } from '@codingame/monaco-vscode-api/workbench';
import type { OpenEditor } from '@codingame/monaco-vscode-editor-service-override';
import type { Logger } from 'monaco-languageclient/common';

export interface MonacoEnvironmentEnhanced extends monaco.Environment {
    vscodeApiInitialising?: boolean;
    vscodeApiInitialised?: boolean;
    vscodeApiGlobalInitAwait?: Promise<void>;
    vscodeApiGlobalInitResolve?: ((value: void | PromiseLike<void>) => void);
    viewServiceType?: 'EditorService' | 'ViewsService' | 'WorkspaceService';
}

export type OverallConfigType = 'extended' | 'classic';

export interface UserConfiguration {
    json?: string;
}
export interface ViewsConfig {
    viewServiceType: 'EditorService' | 'ViewsService' | 'WorkspaceService';
    openEditorFunc?: OpenEditor;
    htmlAugmentationInstructions?: (htmlContainer: HTMLElement | null | undefined) => void;
    viewsInitFunc?: () => Promise<void>;
}

export interface ExtensionConfig {
    config: IExtensionManifest;
    filesOrContents?: Map<string, string | URL>;
}

export interface MonacoVscodeApiConfig {
    $type: OverallConfigType;
    htmlContainer?: HTMLElement;
    serviceOverrides: monaco.editor.IEditorOverrideServices;
    logLevel?: LogLevel | number;
    workspaceConfig?: IWorkbenchConstructionOptions;
    userConfiguration?: UserConfiguration;
    viewsConfig?: ViewsConfig,
    envOptions?: EnvironmentOverride;
    extensions?: ExtensionConfig[];
    monacoWorkerFactory?: (logger?: Logger) => void;
    advanced?: {
        enableExtHostWorker?: boolean;
        loadThemes?: boolean;
        enforceSemanticHighlighting?: boolean;
    };
}

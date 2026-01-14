/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { IWorkbenchConstructionOptions } from '@codingame/monaco-vscode-api';
import { LogLevel } from '@codingame/monaco-vscode-api';
import type { IExtensionManifest } from '@codingame/monaco-vscode-api/extensions';
import type { EnvironmentOverride } from '@codingame/monaco-vscode-api/workbench';
import * as monaco from '@codingame/monaco-vscode-editor-api';
import type { OpenEditor } from '@codingame/monaco-vscode-editor-service-override';
import type { ILogger } from '@codingame/monaco-vscode-log-service-override';

export type OverallConfigType = 'extended' | 'classic';

export type ViewsConfigTypes = 'EditorService' | 'ViewsService' | 'WorkbenchService';

// export type HtmlContainerConfig = HTMLElement;

export interface MonacoEnvironmentEnhanced extends monaco.Environment {
    vscodeApiInitialising?: boolean;
    vscodeApiInitialised?: boolean;
    vscodeApiGlobalInitAwait?: Promise<void>;
    vscodeApiGlobalInitResolve?: ((value: void | PromiseLike<void>) => void);
    viewServiceType?: ViewsConfigTypes;
}

export interface UserConfiguration {
    json?: string;
}

export interface ViewsConfig {
    $type: ViewsConfigTypes;
    htmlContainer?: HTMLElement;
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
    viewsConfig: ViewsConfig,
    serviceOverrides?: monaco.editor.IEditorOverrideServices;
    logLevel?: LogLevel | number;
    workspaceConfig?: IWorkbenchConstructionOptions;
    userConfiguration?: UserConfiguration;
    envOptions?: EnvironmentOverride;
    extensions?: ExtensionConfig[];
    monacoWorkerFactory?: (logger?: ILogger) => void;
    advanced?: {
        loadExtensionServices?: boolean;
        enableExtHostWorker?: boolean;
        loadThemes?: boolean;
        enforceSemanticHighlighting?: boolean;
    };
}

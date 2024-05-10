/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type * as vscode from 'vscode';
import * as monaco from 'monaco-editor';
import { EditorAppBase, EditorAppConfigBase } from './editorAppBase.js';
import { registerExtension, IExtensionManifest, ExtensionHostKind } from 'vscode/extensions';
import { Logger } from 'monaco-languageclient/tools';
import { UserConfig } from './userConfig.js';
import { verifyUrlorCreateDataUrl, ModelUpdateType, isEqual, isModelUpdateRequired } from './utils.js';

export type ExtensionConfig = {
    config: IExtensionManifest | object;
    filesOrContents?: Map<string, string | URL>;
};

export type UserConfiguration = {
    json?: string;
}

export type EditorAppConfigExtended = EditorAppConfigBase & {
    $type: 'extended';
    extensions?: ExtensionConfig[];
    userConfiguration?: UserConfiguration;
};

export type RegisterExtensionResult = {
    id: string;
    dispose(): Promise<void>;
    whenReady(): Promise<void>;
}

interface RegisterLocalExtensionResult extends RegisterExtensionResult {
    registerFileUrl: (path: string, url: string) => monaco.IDisposable;
}

export type RegisterLocalProcessExtensionResult = RegisterLocalExtensionResult & {
    getApi(): Promise<typeof vscode>;
    setAsDefaultApi(): Promise<void>;
};

/**
 * The vscode-apo monaco-editor app uses vscode user and extension configuration for monaco-editor.
 */
export class EditorAppExtended extends EditorAppBase {

    private config: EditorAppConfigExtended;
    private extensionRegisterResults: Map<string, RegisterLocalProcessExtensionResult | RegisterExtensionResult | undefined> = new Map();

    constructor(id: string, userConfig: UserConfig, logger?: Logger) {
        super(id);
        this.logger = logger;
        const userAppConfig = userConfig.wrapperConfig.editorAppConfig as EditorAppConfigExtended;
        this.config = this.buildConfig(userAppConfig) as EditorAppConfigExtended;
        this.config.extensions = userAppConfig.extensions ?? undefined;
        this.config.userConfiguration = userAppConfig.userConfiguration ?? undefined;
    }

    getConfig(): EditorAppConfigExtended {
        return this.config;
    }

    getExtensionRegisterResult(extensionName: string) {
        return this.extensionRegisterResults.get(extensionName);
    }

    override async specifyServices(): Promise<monaco.editor.IEditorOverrideServices> {
        const getTextmateServiceOverride = (await import('@codingame/monaco-vscode-textmate-service-override')).default;
        const getThemeServiceOverride = (await import('@codingame/monaco-vscode-theme-service-override')).default;
        return {
            ...getTextmateServiceOverride(),
            ...getThemeServiceOverride()
        };
    }

    override async init() {
        // await all extensions that should be ready beforehand
        // always await theme extension
        const whenReadyTheme = (await import('@codingame/monaco-vscode-theme-defaults-default-extension')).whenReady;
        const awaitReadiness = (this.config.awaitExtensionReadiness ?? []).concat(whenReadyTheme);
        await this.awaitReadiness(awaitReadiness);

        if (this.config.extensions) {
            const allPromises: Array<Promise<void>> = [];
            for (const extensionConfig of this.config.extensions) {
                const manifest = extensionConfig.config as IExtensionManifest;
                const extRegResult = registerExtension(manifest, ExtensionHostKind.LocalProcess);
                this.extensionRegisterResults.set(manifest.name, extRegResult);
                if (extensionConfig.filesOrContents && Object.hasOwn(extRegResult, 'registerFileUrl')) {
                    for (const entry of extensionConfig.filesOrContents) {
                        (extRegResult as RegisterLocalExtensionResult).registerFileUrl(entry[0], verifyUrlorCreateDataUrl(entry[1]));
                    }
                }
                allPromises.push(extRegResult.whenReady());
            }
            await Promise.all(allPromises);
        }

        // buildConfig ensures userConfiguration is available
        await this.updateUserConfiguration(this.config.userConfiguration?.json);
        this.logger?.info('Init of Extended App was completed.');
    }

    disposeApp(): void {
        this.disposeEditors();
        this.extensionRegisterResults.forEach((k) => k?.dispose());
    }

    isAppConfigDifferent(orgConfig: EditorAppConfigExtended, config: EditorAppConfigExtended, includeModelData: boolean): boolean {
        let different = false;
        if (includeModelData) {
            different = isModelUpdateRequired(orgConfig.codeResources, config.codeResources) !== ModelUpdateType.NONE;
        }
        const propsExtended = [
            // model required changes are not taken into account in this list
            'useDiffEditor',
            'domReadOnly',
            'readOnly',
            'awaitExtensionReadiness',
            'overrideAutomaticLayout',
            'editorOptions',
            'diffEditorOptions',
            'extensions',
            'userConfiguration'
        ];
        type ExtendedKeys = keyof typeof orgConfig;
        const propCompareExtended = (name: string) => {
            return !isEqual(orgConfig[name as ExtendedKeys], config[name as ExtendedKeys]);
        };
        different = different || propsExtended.some(propCompareExtended);
        return different;
    }
}

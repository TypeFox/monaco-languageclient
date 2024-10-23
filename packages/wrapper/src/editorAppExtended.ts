/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type * as vscode from 'vscode';
import * as monaco from 'monaco-editor';
import { registerExtension, IExtensionManifest, ExtensionHostKind } from 'vscode/extensions';
import { Logger } from 'monaco-languageclient/tools';
import { EditorAppBase, EditorAppConfigBase, verifyUrlOrCreateDataUrl } from './editorAppBase.js';
import { DisposableStore } from 'vscode/monaco';

export interface ExtensionConfig {
    config: IExtensionManifest | object;
    filesOrContents?: Map<string, string | URL>;
}

export interface EditorAppConfigExtended extends EditorAppConfigBase {
    $type: 'extended';
    loadThemes?: boolean;
    extensions?: ExtensionConfig[];
}

export interface RegisterExtensionResult {
    id: string;
    dispose(): Promise<void>;
    whenReady(): Promise<void>;
}

export interface RegisterLocalExtensionResult extends RegisterExtensionResult {
    registerFileUrl: (path: string, url: string) => monaco.IDisposable;
}

export interface RegisterLocalProcessExtensionResult extends RegisterLocalExtensionResult {
    getApi(): Promise<typeof vscode>;
    setAsDefaultApi(): Promise<void>;
}

/**
 * The vscode-apo monaco-editor app uses vscode user and extension configuration for monaco-editor.
 */
export class EditorAppExtended extends EditorAppBase {

    private config: EditorAppConfigExtended;
    private extensionRegisterResults: Map<string, RegisterLocalProcessExtensionResult | RegisterExtensionResult | undefined> = new Map();
    private subscriptions: DisposableStore = new DisposableStore();

    constructor(id: string, editorAppConfig: EditorAppConfigExtended, logger?: Logger) {
        super(id);
        this.logger = logger;
        this.config = this.buildConfig(editorAppConfig) as EditorAppConfigExtended;
        this.config.extensions = editorAppConfig.extensions ?? undefined;
        this.config.loadThemes = editorAppConfig.loadThemes ?? true;
    }

    getConfig(): EditorAppConfigExtended {
        return this.config;
    }

    updateHtmlContainer(htmlContainer: HTMLElement) {
        this.config.htmlContainer = htmlContainer;
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
        if (this.config.loadThemes ?? true) {
            await import('@codingame/monaco-vscode-theme-defaults-default-extension');
        }

        if (this.config.extensions) {
            const allPromises: Array<Promise<void>> = [];
            for (const extensionConfig of this.config.extensions) {
                const manifest = extensionConfig.config as IExtensionManifest;
                const extRegResult = registerExtension(manifest, ExtensionHostKind.LocalProcess);
                this.extensionRegisterResults.set(manifest.name, extRegResult);
                if (extensionConfig.filesOrContents && Object.hasOwn(extRegResult, 'registerFileUrl')) {
                    for (const entry of extensionConfig.filesOrContents) {
                        const registerFileUrlResult = (extRegResult as RegisterLocalExtensionResult).registerFileUrl(entry[0], verifyUrlOrCreateDataUrl(entry[1]));
                        this.subscriptions.add(registerFileUrlResult);
                    }
                }
                allPromises.push(extRegResult.whenReady());
            }
            await Promise.all(allPromises);
        }
        this.logger?.info('Init of Extended App was completed.');
    }

    disposeApp(): void {
        this.disposeEditors();
        this.extensionRegisterResults.forEach((k) => k?.dispose());
        this.subscriptions.dispose();
    }

}

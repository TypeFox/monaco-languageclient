/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor';
import { Logger } from 'monaco-languageclient/tools';
import { EditorAppBase, EditorAppConfigBase } from './editorAppBase.js';
import { ModelUpdateType, isEqual, isModelUpdateRequired } from './utils.js';

export interface EditorAppConfigClassic extends EditorAppConfigBase {
    $type: 'classic';
    languageDef?: {
        languageExtensionConfig: monaco.languages.ILanguageExtensionPoint;
        monarchLanguage?: monaco.languages.IMonarchLanguage;
        theme?: {
            name: monaco.editor.BuiltinTheme | string;
            data: monaco.editor.IStandaloneThemeData;
        }
    }
}

/**
 * The classic monaco-editor app uses the classic monaco-editor configuration.
 */
export class EditorAppClassic extends EditorAppBase {

    private config: EditorAppConfigClassic;

    constructor(id: string, editorAppConfig: EditorAppConfigClassic, logger?: Logger) {
        super(id, logger);
        this.config = this.buildConfig(editorAppConfig) as EditorAppConfigClassic;
        this.config.languageDef = editorAppConfig.languageDef;
    }

    getConfig(): EditorAppConfigClassic {
        return this.config;
    }

    override async specifyServices(): Promise<monaco.editor.IEditorOverrideServices> {
        const getMonarchServiceOverride = (await import('@codingame/monaco-vscode-monarch-service-override')).default;
        return {
            ...getMonarchServiceOverride()
        };
    }

    override async loadUserConfiguration() {
        // nothing needed here currently
    }

    async init() {
        const languageDef = this.config.languageDef;
        if (languageDef) {
            // register own language first
            monaco.languages.register(languageDef.languageExtensionConfig);

            const languageRegistered = monaco.languages.getLanguages().filter(x => x.id === languageDef.languageExtensionConfig.id);
            if (languageRegistered.length === 0) {
                // this is only meaningful for languages supported by monaco out of the box
                monaco.languages.register({
                    id: languageDef.languageExtensionConfig.id
                });
            }

            // apply monarch definitions
            if (languageDef.monarchLanguage) {
                monaco.languages.setMonarchTokensProvider(languageDef.languageExtensionConfig.id, languageDef.monarchLanguage);
            }

            if (languageDef.theme) {
                monaco.editor.defineTheme(languageDef.theme.name, languageDef.theme.data);
                monaco.editor.setTheme(languageDef.theme.name);
            }
        }
        this.logger?.info('Init of Classic App was completed.');
    }

    disposeApp(): void {
        this.disposeEditors();
    }

    isAppConfigDifferent(orgConfig: EditorAppConfigBase, config: EditorAppConfigBase, includeModelData: boolean): boolean {
        let different = false;
        if (includeModelData) {
            different = isModelUpdateRequired(orgConfig.codeResources, config.codeResources) !== ModelUpdateType.NONE;
        }
        type ClassicKeys = keyof typeof orgConfig;
        const propsClassic = [
            // model required changes are not taken into account in this list
            'useDiffEditor',
            'domReadOnly',
            'readOnly',
            'overrideAutomaticLayout',
            'editorOptions',
            'diffEditorOptions',
            'theme',
            'languageDef',
            'languageExtensionConfig',
            'themeData'
        ];
        const propCompareClassic = (name: string) => {
            return !isEqual(orgConfig[name as ClassicKeys], config[name as ClassicKeys]);
        };
        different = different || propsClassic.some(propCompareClassic);
        return different;
    }
}

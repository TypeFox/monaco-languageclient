/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor';
import { Logger } from 'monaco-languageclient/tools';
import { EditorAppBase, EditorAppConfigBase, ModelUpdateType, isEqual, isModelUpdateRequired } from './editorAppBase.js';
import { UserConfig } from './userConfig.js';

export type EditorAppConfigClassic = EditorAppConfigBase & {
    $type: 'classic';
    theme?: monaco.editor.BuiltinTheme | string;
    languageExtensionConfig?: monaco.languages.ILanguageExtensionPoint;
    languageDef?: monaco.languages.IMonarchLanguage;
    themeData?: monaco.editor.IStandaloneThemeData;
};

/**
 * The classic monaco-editor app uses the classic monaco-editor configuration.
 */
export class EditorAppClassic extends EditorAppBase {

    private config: EditorAppConfigClassic;
    private logger: Logger | undefined;

    constructor(id: string, userConfig: UserConfig, logger?: Logger) {
        super(id);
        this.logger = logger;
        const userAppConfig = userConfig.wrapperConfig.editorAppConfig as EditorAppConfigClassic;
        this.config = this.buildConfig(userAppConfig) as EditorAppConfigClassic;
        // default to vs-light
        this.config.theme = userAppConfig.theme ?? 'vs-light';
        this.config.languageExtensionConfig = userAppConfig.languageExtensionConfig ?? undefined;
        this.config.languageDef = userAppConfig.languageDef ?? undefined;
        this.config.themeData = userAppConfig.themeData ?? undefined;
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

    async init() {
        // await all extenson that should be ready beforehand
        await this.awaitReadiness(this.config.awaitExtensionReadiness);

        // register own language first
        const extLang = this.config.languageExtensionConfig;
        if (extLang) {
            monaco.languages.register(extLang);
        }

        const languageRegistered = monaco.languages.getLanguages().filter(x => x.id === this.config.languageId);
        if (languageRegistered.length === 0) {
            // this is only meaningful for languages supported by monaco out of the box
            monaco.languages.register({
                id: this.config.languageId
            });
        }

        // apply monarch definitions
        const tokenProvider = this.config.languageDef;
        if (tokenProvider) {
            monaco.languages.setMonarchTokensProvider(this.config.languageId, tokenProvider);
        }
        const themeData = this.config.themeData;
        if (themeData) {
            monaco.editor.defineTheme(this.config.theme!, themeData);
        }
        monaco.editor.setTheme(this.config.theme!);

        if (this.config.editorOptions?.['semanticHighlighting.enabled'] !== undefined) {
            // use updateConfiguration here as otherwise semantic highlighting will not work
            const json = JSON.stringify({
                'editor.semanticHighlighting.enabled': this.config.editorOptions['semanticHighlighting.enabled']
            });
            await this.updateUserConfiguration(json);
        }
        this.logger?.info('Init of Classic App was completed.');
    }

    disposeApp(): void {
        this.disposeEditor();
        this.disposeDiffEditor();
    }

    isAppConfigDifferent(orgConfig: EditorAppConfigClassic, config: EditorAppConfigClassic, includeModelData: boolean): boolean {
        let different = false;
        if (includeModelData) {
            different = isModelUpdateRequired(orgConfig, config) !== ModelUpdateType.NONE;
        }
        type ClassicKeys = keyof typeof orgConfig;
        const propsClassic = [
            // model required changes are not taken into account in this list
            'useDiffEditor',
            'domReadOnly',
            'readOnly',
            'awaitExtensionReadiness',
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

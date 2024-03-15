/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { editor, languages } from 'monaco-editor';
import { EditorAppBase, EditorAppConfigBase, ModelUpdateType, isEqual, isModelUpdateRequired } from './editorAppBase.js';
import { UserConfig } from './wrapper.js';
import { Logger } from './logger.js';

export type EditorAppConfigClassic = EditorAppConfigBase & {
    $type: 'classic';
    theme?: editor.BuiltinTheme | string;
    languageExtensionConfig?: languages.ILanguageExtensionPoint;
    languageDef?: languages.IMonarchLanguage;
    themeData?: editor.IStandaloneThemeData;
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

    override async specifyServices(): Promise<editor.IEditorOverrideServices> {
        return Promise.resolve({});
    }

    async init() {
        // await all extenson that should be ready beforehand
        await this.awaitReadiness(this.config.awaitExtensionReadiness);

        // register own language first
        const extLang = this.config.languageExtensionConfig;
        if (extLang) {
            languages.register(extLang);
        }

        const languageRegistered = languages.getLanguages().filter(x => x.id === this.config.languageId);
        if (languageRegistered.length === 0) {
            // this is only meaningful for languages supported by monaco out of the box
            languages.register({
                id: this.config.languageId
            });
        }

        // apply monarch definitions
        const tokenProvider = this.config.languageDef;
        if (tokenProvider) {
            languages.setMonarchTokensProvider(this.config.languageId, tokenProvider);
        }
        const themeData = this.config.themeData;
        if (themeData) {
            editor.defineTheme(this.config.theme!, themeData);
        }
        editor.setTheme(this.config.theme!);

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
        const propsClassic = ['useDiffEditor', 'domReadOnly', 'readOnly', 'awaitExtensionReadiness', 'overrideAutomaticLayout', 'editorOptions', 'diffEditorOptions', 'languageDef', 'languageExtensionConfig', 'theme', 'themeData'];
        const propCompareClassic = (name: string) => {
            return !isEqual(orgConfig[name as ClassicKeys], config[name as ClassicKeys]);
        };
        different = different || propsClassic.some(propCompareClassic);
        return different;
    }
}

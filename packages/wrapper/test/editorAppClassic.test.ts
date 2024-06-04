/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { EditorAppClassic, EditorAppConfigClassic } from 'monaco-editor-wrapper';
import { createBaseConfig, createEditorAppConfig } from './helper.js';

const buildConfig = () => {
    const config = createBaseConfig('classic');
    (config.wrapperConfig.editorAppConfig as EditorAppConfigClassic).editorOptions = {};
    return config;
};

describe('Test EditorAppClassic', () => {

    test('editorOptions: semanticHighlighting=true', () => {
        const config = buildConfig();
        const configclassic = config.wrapperConfig.editorAppConfig as EditorAppConfigClassic;
        configclassic.editorOptions!['semanticHighlighting.enabled'] = true;

        const app = new EditorAppClassic('config defaults', config);
        expect(configclassic.$type).toEqual('classic');
        expect(app.getConfig().editorOptions?.['semanticHighlighting.enabled']).toBeTruthy();
    });

    test('editorOptions: semanticHighlighting=false', () => {
        const config = buildConfig();
        const configclassic = config.wrapperConfig.editorAppConfig as EditorAppConfigClassic;
        configclassic.editorOptions!['semanticHighlighting.enabled'] = false;

        const app = new EditorAppClassic('config defaults', config);
        expect(app.getConfig().editorOptions?.['semanticHighlighting.enabled']).toBeFalsy();
    });

    test('editorOptions: semanticHighlighting="configuredByTheme"', () => {
        const config = buildConfig();
        const configclassic = config.wrapperConfig.editorAppConfig as EditorAppConfigClassic;
        configclassic.editorOptions!['semanticHighlighting.enabled'] = 'configuredByTheme';

        const app = new EditorAppClassic('config defaults', config);
        expect(app.getConfig().editorOptions?.['semanticHighlighting.enabled']).toEqual('configuredByTheme');
    });

    test('isAppConfigDifferent: basic', () => {
        const orgConfig = createEditorAppConfig('classic') as EditorAppConfigClassic;
        const config = createEditorAppConfig('classic') as EditorAppConfigClassic;
        const app = new EditorAppClassic('test', createBaseConfig('classic'));
        expect(app.isAppConfigDifferent(orgConfig, config, false)).toBeFalsy();

        config.codeResources ??= {};
        config.codeResources.main = {
            text: 'test',
            fileExt: 'js'
        };
        expect(app.isAppConfigDifferent(orgConfig, config, false)).toBeFalsy();
        expect(app.isAppConfigDifferent(orgConfig, config, true)).toBeTruthy();

        config.codeResources.main = {
            text: '',
            fileExt: 'js'
        };
        config.useDiffEditor = true;
        expect(app.isAppConfigDifferent(orgConfig, config, false)).toBeTruthy();
    });

    test('isAppConfigDifferent: non-simple properties"', () => {
        const config1 = buildConfig();
        const config2 = buildConfig();
        const configclassic1 = config1.wrapperConfig.editorAppConfig as EditorAppConfigClassic;
        configclassic1.editorOptions!['semanticHighlighting.enabled'] = true;
        const configclassic2 = config2.wrapperConfig.editorAppConfig as EditorAppConfigClassic;
        configclassic2.editorOptions!['semanticHighlighting.enabled'] = true;

        const app = new EditorAppClassic('config defaults', config1);
        expect(app.isAppConfigDifferent(configclassic1, configclassic2, false)).toBeFalsy();
    });

    test('config defaults', () => {
        const config = createBaseConfig('classic');
        const app = new EditorAppClassic('config defaults', config);
        expect(app.getConfig().codeResources?.main?.text).toEqual('');
        expect(app.getConfig().codeResources?.original).toBeUndefined();
        expect(app.getConfig().useDiffEditor ?? false).toBeFalsy();
        expect(app.getConfig().readOnly).toBeFalsy();
        expect(app.getConfig().domReadOnly).toBeFalsy();
    });

});

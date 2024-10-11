/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { EditorAppClassic, EditorAppConfigClassic, WrapperConfig } from 'monaco-editor-wrapper';
import { createWrapperConfigClassicApp } from './helper.js';

const buildConfig = (): WrapperConfig => {
    const wrapperConfig = createWrapperConfigClassicApp();
    (wrapperConfig.editorAppConfig as EditorAppConfigClassic).editorOptions = {};
    return wrapperConfig;
};

describe('Test EditorAppClassic', () => {

    test('editorOptions: semanticHighlighting=true', () => {
        const wrapperConfig = buildConfig();
        const configClassic = wrapperConfig.editorAppConfig as EditorAppConfigClassic;
        configClassic.editorOptions!['semanticHighlighting.enabled'] = true;

        const app = new EditorAppClassic('config defaults', configClassic);
        expect(configClassic.$type).toEqual('classic');
        expect(app.getConfig().editorOptions?.['semanticHighlighting.enabled']).toBeTruthy();
    });

    test('editorOptions: semanticHighlighting=false', () => {
        const wrapperConfig = buildConfig();
        const configClassic = wrapperConfig.editorAppConfig as EditorAppConfigClassic;
        configClassic.editorOptions!['semanticHighlighting.enabled'] = false;

        const app = new EditorAppClassic('config defaults', configClassic);
        expect(app.getConfig().editorOptions?.['semanticHighlighting.enabled']).toBeFalsy();
    });

    test('editorOptions: semanticHighlighting="configuredByTheme"', () => {
        const wrapperConfig = buildConfig();
        const configClassic = wrapperConfig.editorAppConfig as EditorAppConfigClassic;
        configClassic.editorOptions!['semanticHighlighting.enabled'] = 'configuredByTheme';

        const app = new EditorAppClassic('config defaults', configClassic);
        expect(app.getConfig().editorOptions?.['semanticHighlighting.enabled']).toEqual('configuredByTheme');
    });

    test('config defaults', () => {
        const editorAppConfig = createWrapperConfigClassicApp().editorAppConfig;
        const app = new EditorAppClassic('config defaults', editorAppConfig as EditorAppConfigClassic);
        expect(app.getConfig().codeResources?.main?.text).toEqual('');
        expect(app.getConfig().codeResources?.original).toBeUndefined();
        expect(app.getConfig().useDiffEditor ?? false).toBeFalsy();
        expect(app.getConfig().readOnly).toBeFalsy();
        expect(app.getConfig().domReadOnly).toBeFalsy();
    });

});

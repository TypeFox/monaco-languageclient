/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { EditorApp } from 'monaco-editor-wrapper';
import { createWrapperConfigClassicApp } from './support/helper-classic.js';

describe('Test Test EditorApp (classic)', () => {

    test('classic type: empty EditorAppConfigClassic', () => {
        const wrapperConfig = createWrapperConfigClassicApp({});
        expect(wrapperConfig.$type).toBe('classic');
    });

    test('config defaults', () => {
        const wrapperConfig = createWrapperConfigClassicApp({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const editorApp = new EditorApp(wrapperConfig.$type, 'test-config-defaults', wrapperConfig.editorAppConfig);
        expect(editorApp.getConfig().codeResources?.modified?.text).toEqual('const text = "Hello World!";');
        expect(editorApp.getConfig().codeResources?.original).toBeUndefined();
        expect(editorApp.getConfig().useDiffEditor ?? false).toBeFalsy();
        expect(editorApp.getConfig().readOnly).toBeFalsy();
        expect(editorApp.getConfig().domReadOnly).toBeFalsy();
    });

    test('editorOptions: semanticHighlighting=false', () => {
        const wrapperConfig = createWrapperConfigClassicApp({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const configClassic = wrapperConfig.editorAppConfig;
        configClassic!.editorOptions!['semanticHighlighting.enabled'] = false;

        const editorApp = new EditorApp(wrapperConfig.$type, 'test-semanticHighlighting-false', configClassic);
        expect(editorApp.getConfig().editorOptions?.['semanticHighlighting.enabled']).toBeFalsy();
    });

    test('editorOptions: semanticHighlighting="configuredByTheme"', () => {
        const wrapperConfig = createWrapperConfigClassicApp({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const configClassic = wrapperConfig.editorAppConfig;
        configClassic!.editorOptions!['semanticHighlighting.enabled'] = 'configuredByTheme';

        const editorApp = new EditorApp(wrapperConfig.$type, 'test-semanticHighlighting-theme', configClassic);
        expect(editorApp.getConfig().editorOptions?.['semanticHighlighting.enabled']).toEqual('configuredByTheme');
    });

    test('editorOptions: semanticHighlighting=true', () => {
        const wrapperConfig = createWrapperConfigClassicApp({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const configClassic = wrapperConfig.editorAppConfig;
        configClassic!.editorOptions!['semanticHighlighting.enabled'] = true;

        const editorApp = new EditorApp(wrapperConfig.$type, 'test-semanticHighlighting-true', configClassic);
        expect(wrapperConfig.$type).toEqual('classic');
        expect(editorApp.getConfig().editorOptions?.['semanticHighlighting.enabled']).toBeTruthy();
    });

});

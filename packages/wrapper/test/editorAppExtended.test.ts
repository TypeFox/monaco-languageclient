/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { EditorAppConfigExtended, EditorAppExtended, verifyUrlOrCreateDataUrl } from 'monaco-editor-wrapper';
import { createBaseConfig, createEditorAppConfig } from './helper.js';

describe('Test EditorAppExtended', () => {

    test('verifyUrlorCreateDataUrl: url', () => {
        const url = new URL('./editorAppExtended.test.ts', import.meta.url);
        expect(verifyUrlOrCreateDataUrl(url)).toBe(url.href);
    });

    test('verifyUrlorCreateDataUrl: url', async () => {
        const url = new URL('../../../node_modules/langium-statemachine-dsl/syntaxes/statemachine.tmLanguage.json', window.location.href);
        const text = await (await fetch(url)).text();
        expect(verifyUrlOrCreateDataUrl(text)).toBe(`data:text/plain;base64,${btoa(text)}`);
    });

    test('config userConfiguration', () => {
        const config = createBaseConfig('extended');
        const appConfig = config.wrapperConfig.editorAppConfig as EditorAppConfigExtended;
        appConfig.userConfiguration = {
            json: '{ "editor.semanticHighlighting.enabled": true }'
        };
        const app = new EditorAppExtended('config defaults', config);
        expect(app.getConfig().userConfiguration?.json).toEqual('{ "editor.semanticHighlighting.enabled": true }');
    });

    test('isAppConfigDifferent: basic', () => {
        const orgConfig = createEditorAppConfig('extended') as EditorAppConfigExtended;
        const config = createEditorAppConfig('extended') as EditorAppConfigExtended;
        const app = new EditorAppExtended('test', createBaseConfig('extended'));
        expect(app.isAppConfigDifferent(orgConfig, config, false)).toBeFalsy();

        if (!config.codeResources) {
            config.codeResources = {};
        }

        config.codeResources.main = {
            text: 'test',
            fileExt: 'js'
        };
        expect(app.isAppConfigDifferent(orgConfig, config, true)).toBeTruthy();

        config.codeResources.main = {
            text: '',
            fileExt: 'js'
        };
        config.extensions = [{
            config: {
                name: 'Tester',
                publisher: 'Tester',
                version: '1.0.0',
                engines: {
                    vscode: '*'
                }
            }
        }];
        expect(app.isAppConfigDifferent(orgConfig, config, false)).toBeTruthy();
    });

    test('config defaults', () => {
        const config = createBaseConfig('extended');
        const app = new EditorAppExtended('config defaults', config);
        expect(app.getConfig().codeResources?.main?.text).toEqual('');
        expect(app.getConfig().codeResources?.original).toBeUndefined();
        expect(app.getConfig().useDiffEditor === true).toBeFalsy();
        expect(app.getConfig().readOnly).toBeFalsy();
        expect(app.getConfig().domReadOnly).toBeFalsy();
    });
});

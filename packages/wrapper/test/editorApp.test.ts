/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { EditorApp, verifyUrlOrCreateDataUrl } from 'monaco-editor-wrapper';
import { createWrapperConfigExtendedApp } from './support/helper.js';

describe('Test EditorApp', () => {

    test('extended type: empty EditorAppConfigExtended', () => {
        const wrapperConfig = createWrapperConfigExtendedApp();
        expect(wrapperConfig.$type).toBe('extended');
    });

    test('verifyUrlorCreateDataUrl: url', () => {
        const url = new URL('./editorAppExtended.test.ts', import.meta.url);
        expect(verifyUrlOrCreateDataUrl(url)).toBe(url.href);
    });

    test('verifyUrlorCreateDataUrl: url', async () => {
        const url = new URL('../../../node_modules/langium-statemachine-dsl/syntaxes/statemachine.tmLanguage.json', window.location.href);
        const text = await (await fetch(url)).text();
        expect(verifyUrlOrCreateDataUrl(text)).toBe(`data:text/plain;base64,${btoa(text)}`);
    });

    test('config defaults', () => {
        const wrapperConfig = createWrapperConfigExtendedApp();
        const app = new EditorApp('config defaults', wrapperConfig.$type, wrapperConfig.editorAppConfig);
        expect(app.getConfig().codeResources?.modified?.text).toEqual('');
        expect(app.getConfig().codeResources?.original).toBeUndefined();
        expect(app.getConfig().useDiffEditor ?? false).toBeFalsy();
        expect(app.getConfig().readOnly).toBeFalsy();
        expect(app.getConfig().domReadOnly).toBeFalsy();
    });
});

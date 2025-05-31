/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/* eslint-disable dot-notation */

import { verifyUrlOrCreateDataUrl } from 'monaco-languageclient/common';
import { EditorApp, type TextContents } from 'monaco-languageclient/editorApp';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { createDefaultMonacoVscodeApiConfig, createEditorAppConfigClassicExtended, createMonacoEditorDiv } from '../support/helper.js';

describe('Test EditorApp', () => {

    const htmlContainer = createMonacoEditorDiv();

    beforeAll(async () => {
        const apiConfig = createDefaultMonacoVscodeApiConfig(htmlContainer);
        const apiWrapper = new MonacoVscodeApiWrapper(apiConfig);
        await apiWrapper.init();
    });

    test('extended type: empty EditorAppConfigExtended', () => {
        const editorAppConfig = createEditorAppConfigClassicExtended({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        expect(editorAppConfig.$type).toBe('extended');
    });

    test('verifyUrlorCreateDataUrl: url', () => {
        const url = new URL('./editorAppExtended.test.ts', import.meta.url);
        expect(verifyUrlOrCreateDataUrl(url)).toBe(url.href);
    });

    test('verifyUrlorCreateDataUrl: url', async () => {
        const url = new URL('../../../node_modules/langium-statemachine-dsl/syntaxes/statemachine.tmLanguage.json', window.location.href);
        const text = await (await fetch(url)).text();
        const bytes = new TextEncoder().encode(text);
        const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join('');
        const base64 = btoa(binString);
        expect(verifyUrlOrCreateDataUrl(text)).toBe(`data:text/plain;base64,${base64}`);
    });

    test('verifyUrlorCreateDataUrl: url', () => {
        const text = '✓✓';
        const bytes = new TextEncoder().encode(text);
        const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join('');
        const base64 = btoa(binString);
        expect(verifyUrlOrCreateDataUrl(text)).toBe(`data:text/plain;base64,${base64}`);
    });

    test('config defaults', () => {
        const editorAppConfig = createEditorAppConfigClassicExtended({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        editorAppConfig.id = 'test-config-defaults';

        const editorApp = new EditorApp(editorAppConfig);
        expect(editorApp.getConfig().codeResources?.modified?.text).toEqual('const text = "Hello World!";');
        expect(editorApp.getConfig().codeResources?.original).toBeUndefined();
        expect(editorApp.getConfig().useDiffEditor ?? false).toBeFalsy();
        expect(editorApp.getConfig().readOnly).toBeFalsy();
        expect(editorApp.getConfig().domReadOnly).toBeFalsy();
    });

    test('New editorApp has undefined editor', () => {
        const editorAppConfig = createEditorAppConfigClassicExtended({});
        const editorApp = new EditorApp(editorAppConfig);
        expect(editorApp.getEditor()).toBeUndefined();
    });

    test('New editorApp has undefined diff editor', () => {
        const editorAppConfig = createEditorAppConfigClassicExtended({});
        const editorApp = new EditorApp(editorAppConfig);
        expect(editorApp.getDiffEditor()).toBeUndefined();
    });

    test('Start EditorApp', async () => {
        const editorAppConfig = createEditorAppConfigClassicExtended({});
        const editorApp = new EditorApp(editorAppConfig);
        await expect(await editorApp.start(htmlContainer)).toBeUndefined();
    });

    test('Update code resources after start (same file)', async () => {
        const editorAppConfig = createEditorAppConfigClassicExtended({
            modified: {
                text: 'const text = "Hello World";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const editorApp = new EditorApp(editorAppConfig);

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();
        expect(editorApp.isStarted()).toBeTruthy();

        editorApp.registerOnTextChangedCallback((textChanges: TextContents) => {
            console.log(`text: ${textChanges.modified}\ntextOriginal: ${textChanges.original}`);
        });

        editorApp.setModelRefDisposeTimeout(1000);

        await editorApp.updateCodeResources({
            modified: {
                text: 'const text = "Goodbye World";',
                uri: `/workspace/${expect.getState().testPath}_2.js`
            }
        });

        const textModels = editorApp.getTextModels();
        expect(textModels.modified?.getValue()).toEqual('const text = "Goodbye World";');

        expect(editorApp.getEditor()?.getModel()?.getValue()).toEqual('const text = "Goodbye World";');
    });

    test('Update code resources after start (different file)', async () => {
        const editorAppConfig = createEditorAppConfigClassicExtended({
            modified: {
                text: 'const text = "Hello World";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const editorApp = new EditorApp(editorAppConfig);

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();
        expect(editorApp.isStarted()).toBeTruthy();

        editorApp.setModelRefDisposeTimeout(1000);

        await expect(await editorApp.updateCodeResources({
            modified: {
                text: 'const text = "Goodbye World";',
                uri: `/workspace/${expect.getState().testPath}_2.js`,
            }
        })).toBeUndefined();

        const textModels = editorApp.getTextModels();
        expect(textModels.modified?.getValue()).toEqual('const text = "Goodbye World";');

        expect(editorApp.getEditor()?.getModel()?.getValue()).toEqual('const text = "Goodbye World";');
    });

    test('Verify registerTextChangeCallback', async () => {
        const editorAppConfig = createEditorAppConfigClassicExtended({});

        const onTextChanged = (textChanges: TextContents) => {
            console.log(`text: ${textChanges.modified}\ntextOriginal: ${textChanges.original}`);
        };
        const editorApp = new EditorApp(editorAppConfig);

        let onTextChangedDiposeable = editorApp['textChangedDiposeables'].modified;
        expect(onTextChangedDiposeable).toBeUndefined();

        editorApp.registerOnTextChangedCallback(onTextChanged);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spyAnnounceModelUpdate = vi.spyOn(editorApp as any, 'announceModelUpdate');

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();

        onTextChangedDiposeable = editorApp['textChangedDiposeables'].modified;
        expect(onTextChangedDiposeable).toBeDefined();

        const spyOnTextChangedDiposeable = vi.spyOn(onTextChangedDiposeable, 'dispose');

        // because there are default models now, the first update of models will not lead to onTextChanged dispoe
        expect(spyAnnounceModelUpdate).toHaveBeenCalledTimes(1);
        expect(spyOnTextChangedDiposeable).toHaveBeenCalledTimes(0);
        editorApp.setModelRefDisposeTimeout(1000);

        await editorApp.updateCodeResources({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}_2.statemachine`,
            }
        });

        expect(spyAnnounceModelUpdate).toHaveBeenCalledTimes(2);
        expect(spyOnTextChangedDiposeable).toHaveBeenCalledTimes(1);
    });

    test('Test editorApp init/start/dispose phase promises', async () => {
        let editorAppConfig = createEditorAppConfigClassicExtended({
            modified: {
                text: 'const text = "Hello World";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        let editorApp = new EditorApp(editorAppConfig);

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();
        expect(editorApp.isStarting()).toBeFalsy();
        expect(editorApp.isDisposing()).toBeFalsy();

        await expect(await editorApp.dispose()).toBeUndefined();

        expect(editorApp.isStarting()).toBeFalsy();
        expect(editorApp.isDisposing()).toBeFalsy();

        editorAppConfig = createEditorAppConfigClassicExtended({
            modified: {
                text: 'const text = "Hello World";',
                uri: `/workspace/${expect.getState().testPath}_2.js`
            }
        });
        editorApp = new EditorApp(editorAppConfig);
        await expect(await editorApp.start(htmlContainer)).toBeUndefined();
    });

    test('Test html parameter with start', async () => {
        const editorAppConfig = createEditorAppConfigClassicExtended({
            modified: {
                text: 'const text = "Hello World";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const editorApp = new EditorApp(editorAppConfig);

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();
    });

});

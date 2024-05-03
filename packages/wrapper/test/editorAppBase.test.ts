/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { isCodeUpdateRequired, isModelUpdateRequired, EditorAppClassic, ModelUpdateType } from 'monaco-editor-wrapper';
import { createBaseConfig, createEditorAppConfig, createWrapperConfig } from './helper.js';

describe('Test EditorAppBase', () => {

    test('classic type: empty EditorAppConfigClassic', () => {
        const wrapperConfig = createWrapperConfig('classic');
        expect(wrapperConfig.editorAppConfig.$type).toBe('classic');
    });

    test('extended type: empty EditorAppConfigExtended', () => {
        const wrapperConfig = createWrapperConfig('extended');
        expect(wrapperConfig.editorAppConfig.$type).toBe('extended');
    });

    test('config defaults', () => {
        const config = createBaseConfig('classic');
        const app = new EditorAppClassic('config defaults', config);
        expect(app.getConfig().codeResources.main?.text).toEqual('');
        expect(app.getConfig().codeResources.original).toBeUndefined();
        expect(app.getConfig().useDiffEditor).toBeFalsy();
        expect(app.getConfig().readOnly).toBeFalsy();
        expect(app.getConfig().domReadOnly).toBeFalsy();
    });

    test('isCodeUpdateRequired', () => {
        let codeUpdateType = isCodeUpdateRequired({ main: { text: '', fileExt: 'js' } }, { main: { text: '', fileExt: 'js' } });
        expect(codeUpdateType).toBe(ModelUpdateType.NONE);

        codeUpdateType = isCodeUpdateRequired({}, {});
        expect(codeUpdateType).toBe(ModelUpdateType.NONE);

        codeUpdateType = isCodeUpdateRequired({ main: { text: 'bar', fileExt: 'js' } }, { main: { text: '', fileExt: 'js' } });
        expect(codeUpdateType).toBe(ModelUpdateType.CODE);

        codeUpdateType = isCodeUpdateRequired({ main: { text: '', fileExt: 'js' } }, { main: { text: 'bar', fileExt: 'js' } });
        expect(codeUpdateType).toBe(ModelUpdateType.CODE);

        codeUpdateType = isCodeUpdateRequired({}, { main: { text: 'bar', fileExt: 'js' } });
        expect(codeUpdateType).toBe(ModelUpdateType.CODE);

        codeUpdateType = isCodeUpdateRequired({ main: { text: 'bar', fileExt: 'js' } }, {});
        expect(codeUpdateType).toBe(ModelUpdateType.CODE);
    });

    test('isModelUpdateRequired', () => {
        const config = createEditorAppConfig('classic');

        let modelUpdateType = isModelUpdateRequired(config.codeResources, { main: { text: '', fileExt: 'js' } });
        expect(modelUpdateType).toBe(ModelUpdateType.NONE);

        modelUpdateType = isModelUpdateRequired(config.codeResources, { main: { text: 'bar', fileExt: 'js' } });
        expect(modelUpdateType).toBe(ModelUpdateType.CODE);

        modelUpdateType = isModelUpdateRequired(config.codeResources, { main: { text: 'bar', uri: 'file:///bar.js' } });
        expect(modelUpdateType).toBe(ModelUpdateType.CODE_AND_MODEL);

        modelUpdateType = isModelUpdateRequired(config.codeResources, { original: { text: 'bar', fileExt: 'python' } });
        expect(modelUpdateType).toBe(ModelUpdateType.CODE_AND_MODEL);

        modelUpdateType = isModelUpdateRequired(config.codeResources, {});
        expect(modelUpdateType).toBe(ModelUpdateType.CODE_AND_MODEL);
    });

});

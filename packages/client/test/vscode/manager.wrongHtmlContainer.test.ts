/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { describe, expect, test } from 'vitest';
import { createDefaultMonacoVscodeApiConfig, createMonacoEditorDiv } from '../support/helper.js';

describe('MonacoVscodeApiWrapper Tests: Different config', () => {

    const htmlContainer = createMonacoEditorDiv();

    test('Start MonacoVscodeApiWrapper with ViewsService but no htmlContainer', async () => {
        const apiConfig = createDefaultMonacoVscodeApiConfig('extended', htmlContainer, 'ViewsService');
        apiConfig.viewsConfig.htmlContainer = undefined;

        let apiWrapper: MonacoVscodeApiWrapper;
        expect(() => {
            apiWrapper = new MonacoVscodeApiWrapper(apiConfig!);
        }).toThrowError('View Service Type "ViewsService" requires a HTMLElement.');
        expect(apiWrapper!).toBeUndefined();
    });

    test('Start MonacoVscodeApiWrapper with WorkbenchService but no htmlContainer', async () => {
        const apiConfig = createDefaultMonacoVscodeApiConfig('extended', htmlContainer, 'WorkbenchService');
        apiConfig.viewsConfig.htmlContainer = undefined;

        let apiWrapper: MonacoVscodeApiWrapper;
        await expect(async () => {
            apiWrapper = new MonacoVscodeApiWrapper(apiConfig!);
        }).rejects.toThrowError('View Service Type "WorkbenchService" requires a HTMLElement.');
        expect(apiWrapper!).toBeUndefined();
    });

    test('Start MonacoVscodeApiWrapper with EditorService but no htmlContainer', async () => {
        const apiConfig = createDefaultMonacoVscodeApiConfig('extended', htmlContainer, 'EditorService');
        apiConfig.viewsConfig.htmlContainer = undefined;

        const apiWrapper = new MonacoVscodeApiWrapper(apiConfig!);
        expect(apiWrapper).toBeDefined();
    });

});

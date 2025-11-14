/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { describe, expect, test } from 'vitest';
import { createDefaultMonacoVscodeApiConfig } from '../support/helper.js';

describe('MonacoVscodeApiWrapper Tests: Different config', () => {

    test('Start MonacoVscodeApiWrapper with WorkbenchService but no htmlContainer', async () => {
        const apiConfig = createDefaultMonacoVscodeApiConfig('extended', undefined, 'WorkbenchService');

        const apiWrapper = new MonacoVscodeApiWrapper(apiConfig);
        await expect(async () => {
            await apiWrapper.start();
        }).rejects.toThrowError('View Service Type "WorkbenchService" requires a HTMLElement.');
    });

});

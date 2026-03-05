/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { describe, expect, test } from 'vitest';
import { createDefaultMonacoVscodeApiConfig } from '../support/helper.js';

describe('MonacoVscodeApiWrapper Tests: Different config', () => {
    test('Start MonacoVscodeApiWrapper with ViewsService but no htmlContainer', async () => {
        const apiConfig = createDefaultMonacoVscodeApiConfig('extended', undefined, 'ViewsService');

        const apiWrapper = new MonacoVscodeApiWrapper(apiConfig);
        await expect(async () => {
            await apiWrapper.start();
        }).rejects.toThrowError('View Service Type "ViewsService" requires a HTMLElement.');
    });
});

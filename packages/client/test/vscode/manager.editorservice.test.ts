/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import type { ILogger } from '@codingame/monaco-vscode-log-service-override';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { describe, expect, test } from 'vitest';
import { createDefaultMonacoVscodeApiConfig } from '../support/helper.js';

describe('MonacoVscodeApiWrapper Tests: Different config', () => {

    test('Start MonacoVscodeApiWrapper with EditorService but no htmlContainer', async () => {
        const apiConfig = createDefaultMonacoVscodeApiConfig('extended', undefined, 'EditorService');

        const apiWrapper = new MonacoVscodeApiWrapper(apiConfig!);
        const awaited = await apiWrapper.start();
        expect(awaited).toBeUndefined();

        // eslint-disable-next-line dot-notation
        expect((apiWrapper['logger'] as ILogger).getLevel()).toBe(LogLevel.Off);
    });

});

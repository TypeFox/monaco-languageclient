/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { createWrapperConfigClassicApp, createWrapperConfigExtendedApp } from './helper.js';

describe('Test EditorAppBase', () => {

    test('classic type: empty EditorAppConfigClassic', () => {
        const wrapperConfig = createWrapperConfigClassicApp();
        expect(wrapperConfig.editorAppConfig.$type).toBe('classic');
    });

    test('extended type: empty EditorAppConfigExtended', () => {
        const wrapperConfig = createWrapperConfigExtendedApp();
        expect(wrapperConfig.editorAppConfig.$type).toBe('extended');
    });

});

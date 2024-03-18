/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { Logger } from 'monaco-editor-wrapper';

describe('Logger', () => {

    test('Config: None', () => {
        const logger = new Logger();

        expect(logger.isEnabled()).toBeTruthy();
        expect(logger.isDebugEnabled()).toBeFalsy();
    });

    test('Config: disabled', () => {
        const logger = new Logger({
            enabled: false
        });

        expect(logger.isEnabled()).toBeFalsy();
        expect(logger.isDebugEnabled()).toBeFalsy();
    });

    test('Config: disabled, debug enabled', () => {
        const logger = new Logger({
            enabled: false,
            debugEnabled: true
        });

        expect(logger.isEnabled()).toBeFalsy();
        expect(logger.isDebugEnabled()).toBeFalsy();
    });

    test('Config: enabled, debug disabled', () => {
        const logger = new Logger({
            enabled: true,
            debugEnabled: false
        });

        expect(logger.isEnabled()).toBeTruthy();
        expect(logger.isDebugEnabled()).toBeFalsy();
    });

    test('Config: enabled, debug enabled', () => {
        const logger = new Logger({
            enabled: true,
            debugEnabled: true
        });

        expect(logger.isEnabled()).toBeTruthy();
        expect(logger.isDebugEnabled()).toBeTruthy();
    });

});

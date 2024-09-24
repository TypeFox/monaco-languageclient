/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { checkLogLevel, ConsoleLogger } from 'monaco-languageclient/tools';
import { LogLevel } from 'vscode/services';

describe('Logger', () => {

    test('Config: None', () => {
        const logger = new ConsoleLogger();

        expect(logger.getLevel()).toBe(LogLevel.Off);
    });

    test('Config: Off', () => {
        const logger = new ConsoleLogger(LogLevel.Off);

        expect(logger.getLevel()).toBe(LogLevel.Off);
    });

    test('Config: Info', () => {
        const logger = new ConsoleLogger(LogLevel.Info);

        expect(logger.getLevel()).toBe(LogLevel.Info);
    });

    test('Config: Debug', () => {
        const logger = new ConsoleLogger(LogLevel.Debug);

        expect(logger.getLevel()).toBe(LogLevel.Debug);
    });

    test('Config: checkLogLevel debug', () => {
        const logger = new ConsoleLogger(checkLogLevel(2));

        expect(logger.getLevel()).toBe(LogLevel.Debug);
    });

});

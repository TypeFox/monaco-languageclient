/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { LogLevel } from 'vscode/services';
import { augmentVscodeApiConfig } from '../../src/vscode/services.js';

describe('createUrl', () => {

    test('test configureServices logLevel trace', async () => {
        const vscodeApiConfig = await augmentVscodeApiConfig('extended', {
            vscodeApiConfig: {
                loadThemes: false
            },
            logLevel: LogLevel.Trace
        });

        expect(vscodeApiConfig.workspaceConfig?.developmentOptions?.logLevel).toBe(LogLevel.Trace);
    });

    test('test configureServices logLevel and developmenet info', async () => {
        const vscodeApiConfig = await augmentVscodeApiConfig('extended', {
            vscodeApiConfig: {
                loadThemes: false,
                workspaceConfig: {
                    developmentOptions: {
                        logLevel: LogLevel.Info
                    }
                }
            },
            logLevel: LogLevel.Info
        });

        expect(vscodeApiConfig.workspaceConfig?.developmentOptions?.logLevel).toBe(LogLevel.Info);
    });

    test('test configureServices logLevel development mismatch', async () => {
        await expect(async () => {
            await augmentVscodeApiConfig('extended', {
                vscodeApiConfig: {
                    loadThemes: false,
                    workspaceConfig: {
                        developmentOptions: {
                            logLevel: LogLevel.Info
                        }
                    }
                },
                logLevel: LogLevel.Trace
            });
        }).rejects.toThrowError('You have configured mismatching logLevels: 1 (wrapperConfig) 3 (workspaceConfig.developmentOptions)');
    });

});

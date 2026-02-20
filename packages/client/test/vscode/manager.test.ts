/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/* oxlint-disable dot-notation */

import { beforeAll, describe, expect, test } from 'vitest';
import { IConfigurationService, LogLevel, StandaloneServices } from '@codingame/monaco-vscode-api';
import { getEnhancedMonacoEnvironment, MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { createDefaultMonacoVscodeApiConfig, createMonacoEditorDiv } from '../support/helper.js';

describe('MonacoVscodeApiWrapper Tests', () => {

    let apiWrapper: MonacoVscodeApiWrapper;
    const htmlContainer = createMonacoEditorDiv();

    beforeAll(() => {
        const apiConfig = createDefaultMonacoVscodeApiConfig('extended', htmlContainer, 'EditorService');
        apiConfig.extensions = [{
            config: {
                name: 'unit-test-extension',
                publisher: 'TypeFox',
                version: '1.0.0',
                engines: {
                    vscode: '*'
                },
                contributes: {
                    languages: [{
                        id: 'js',
                        extensions: ['.js'],
                        configuration: './language-configuration.json'
                    }],
                    grammars: [{
                        language: 'js',
                        scopeName: 'source.js',
                        path: './javascript.tmLanguage.json'
                    }]
                }
            },
            filesOrContents: new Map([
                ['/language-configuration.json', '{}'],
                ['/javascript.tmLanguage.json', '{}']
            ]),
        }];
        apiWrapper = new MonacoVscodeApiWrapper(apiConfig);
    });

    test.sequential('test init MonacoVscodeApiWrapper and gloabl state', async () => {
        expect(typeof MonacoEnvironment === 'undefined').toBeTruthy();

        // call init with api config
        const promise = apiWrapper.start();
        let envEnhanced = getEnhancedMonacoEnvironment();
        expect(envEnhanced.vscodeApiGlobalInitAwait).toBeDefined();
        expect(envEnhanced.vscodeApiGlobalInitResolve).toBeDefined();
        expect(envEnhanced.vscodeApiInitialised).toBeFalsy();

        // wait for the initial promise to complete and expect that api init was completed and is no longer ongoing
        await expect(await promise).toBeUndefined();
        envEnhanced = getEnhancedMonacoEnvironment();
        expect(envEnhanced.vscodeApiGlobalInitAwait).toBeUndefined();
        expect(envEnhanced.vscodeApiGlobalInitResolve).toBeUndefined();
        expect(envEnhanced.vscodeApiInitialised).toBeTruthy();
        expect(envEnhanced.viewServiceType).toBe('EditorService');
        expect(apiWrapper.getMonacoVscodeApiConfig().workspaceConfig?.developmentOptions?.logLevel).toBe(LogLevel.Off);
    });

    test.sequential('test configureServices logLevel and developmenet info', () => {
        const apiConfig = apiWrapper.getMonacoVscodeApiConfig();
        apiConfig.logLevel = LogLevel.Info;
        apiConfig.workspaceConfig = {
            ...apiConfig.workspaceConfig,
            developmentOptions: {
                logLevel: LogLevel.Info
            }
        };

        apiWrapper['configureDevLogLevel']();
        expect(apiWrapper.getMonacoVscodeApiConfig().workspaceConfig?.developmentOptions?.logLevel).toBe(LogLevel.Info);
    });

    test.sequential('test configureServices logLevel and developmenet debug', () => {
        const apiConfig = apiWrapper.getMonacoVscodeApiConfig();
        apiConfig.logLevel = LogLevel.Debug;
        apiConfig.workspaceConfig = {
            ...apiConfig.workspaceConfig,
            developmentOptions: {
                logLevel: LogLevel.Debug
            }
        };

        apiWrapper['configureDevLogLevel']();
        expect(apiWrapper.getMonacoVscodeApiConfig().workspaceConfig?.developmentOptions?.logLevel).toBe(LogLevel.Debug);
    });

    test.sequential('test configureServices logLevel development mismatch', () => {
        const apiConfig = apiWrapper.getMonacoVscodeApiConfig();
        apiConfig.logLevel = LogLevel.Trace;
        apiConfig.workspaceConfig = {
            ...apiConfig.workspaceConfig,
            developmentOptions: {
                logLevel: LogLevel.Info
            }
        };

        expect(() => apiWrapper['configureDevLogLevel']()).toThrowError('You have configured mismatching logLevels: 1 (wrapperConfig) 3 (workspaceConfig.developmentOptions)');
    });

    test.sequential('test semanticHighlighting.enabled workaround', async () => {
        expect(apiWrapper.getMonacoVscodeApiConfig().workspaceConfig?.configurationDefaults?.['editor.semanticHighlighting.enabled']).toEqual(true);

        const semHigh = await new Promise<unknown>(resolve => {
            setTimeout(() => {
                resolve(StandaloneServices.get(IConfigurationService).getValue('editor.semanticHighlighting.enabled'));
            }, 100);
        });
        expect(semHigh).toEqual(true);
    });

    test.sequential('test dispose extensions and re-init', async () => {
        expect(() => apiWrapper.dispose()).not.toThrowError();
        expect(await apiWrapper.initExtensions()).toBeUndefined();
    });

});

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { initServices, MonacoEnvironmentEnhanced } from 'monaco-languageclient/vscode/services';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';

describe('VSCde services Tests', () => {

    test('initServices', async () => {
        const vscodeApiConfig = {
            serviceOverrides: {
                ...getConfigurationServiceOverride()
            },
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'Default Dark Modern'
                })
            }
        };

        let envEnhanced = (self as Window).MonacoEnvironment as MonacoEnvironmentEnhanced;
        expect(envEnhanced).toBeUndefined();

        // call initServices with userConfiguration
        const promise = initServices(vscodeApiConfig);
        envEnhanced = (self as Window).MonacoEnvironment as MonacoEnvironmentEnhanced;
        expect(envEnhanced.vscodeInitialising).toBeTruthy();
        expect(envEnhanced.vscodeApiInitialised).toBeFalsy();

        // try a second time and expect that the api init is ongoing but not completed
        const secondCallResult = await initServices(vscodeApiConfig);

        expect(secondCallResult).toBeFalsy();
        envEnhanced = (self as Window).MonacoEnvironment as MonacoEnvironmentEnhanced;
        expect(envEnhanced.vscodeInitialising).toBeTruthy();
        expect(envEnhanced.vscodeApiInitialised).toBeFalsy();

        // wait for the initial promise to complete and expect that api init was completed and is no longer ongoing
        const initialCallResult = await promise;
        expect(initialCallResult).toBeTruthy();
        envEnhanced = (self as Window).MonacoEnvironment as MonacoEnvironmentEnhanced;
        expect(envEnhanced.vscodeInitialising).toBeFalsy();
        expect(envEnhanced.vscodeApiInitialised).toBeTruthy();
    });

});

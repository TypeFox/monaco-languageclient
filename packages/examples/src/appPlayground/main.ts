/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { configure } from './config.js';
import { configurePostStart } from './common.js';
import { disableElement } from '../common/client/utils.js';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';

export const runApplicationPlayground = async () => {
    disableElement('button-start', true);

    const configResult = await configure(document.body);

    // perform global init
    const apiWrapper = new MonacoVscodeApiWrapper(configResult.vscodeApiConfig);
    await apiWrapper.init();

    await configurePostStart(apiWrapper, configResult);
};

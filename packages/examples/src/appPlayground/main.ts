/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { configure } from './config.js';
import { configurePostStart } from './common.js';
import { disableElement } from '../common/client/utils.js';

const wrapper = new MonacoEditorLanguageClientWrapper();

export const runApplicationPlayground = async () => {
    disableElement('button-start', true);
    const configResult = await configure(document.body);
    await wrapper.init(configResult.wrapperConfig);
    await configurePostStart(wrapper, configResult);
};

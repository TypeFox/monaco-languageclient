/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { initLocaleLoader } from 'monaco-languageclient/vscodeApiLocales';
await initLocaleLoader();

const { runStatemachine } = await import('./main.js');
await runStatemachine();

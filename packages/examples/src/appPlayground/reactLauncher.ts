/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { initLocaleLoader } from 'monaco-editor-wrapper/vscode/locale';
await initLocaleLoader();

const { runApplicationPlaygroundReact } = await import('./reactMain.js');
runApplicationPlaygroundReact();

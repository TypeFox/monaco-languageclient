/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import type { OverallConfigType } from 'monaco-languageclient/vscodeApiWrapper';
import type { EditorAppConfig } from './editorApp.js';

export interface WrapperConfig {
    $type: OverallConfigType;
    id?: string;
    // default is true if not specified as it is optional
    automaticallyDispose?: boolean;
    logLevel?: LogLevel | number;
    editorAppConfig?: EditorAppConfig;
}


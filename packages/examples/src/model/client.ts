/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { languages } from 'monaco-editor';
export interface LanguageClientRunConfig {
    vscodeApiInit : boolean;
    clientUrl: string;
    serverPath: string;
    serverPort: number;
    registerConfig: languages.ILanguageExtensionPoint;
    defaultContent: string;
    /** CSS id selector */
    htmlElementId: string;
}

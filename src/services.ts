/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { BaseLanguageClient } from "vscode-base-languageclient/lib/base";
import { MonacoToProtocolConverter, ProtocolToMonacoConverter } from "./converter";
import { MonacoCommands } from './commands';
import { MonacoLanguages } from "./languages";
import { MonacoWorkspace } from "./workspace";
import { ConsoleWindow } from "./console-window";

export function createMonacoServices(editor: monaco.editor.IStandaloneCodeEditor, options: MonacoServicesOptions = {}): BaseLanguageClient.IServices {
    const m2p = new MonacoToProtocolConverter();
    const p2m = new ProtocolToMonacoConverter();
    return {
        commands: new MonacoCommands(editor),
        languages: new MonacoLanguages(p2m, m2p),
        workspace: new MonacoWorkspace(p2m, m2p, options.rootUri),
        window: new ConsoleWindow()
    }
}

export interface MonacoServicesOptions {
    rootUri?: string
}
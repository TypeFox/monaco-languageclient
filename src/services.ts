/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { BaseLanguageClient } from "vscode-base-languageclient/lib/base";
import { MonacoToProtocolConverter, ProtocolToMonacoConverter } from "./converter";
import { MonacoLanguages } from "./languages";
import { MonacoWorkspace } from "./workspace";
import { ConsoleWindow } from "./console-window";

export function createMonacoServices(): BaseLanguageClient.IServices {
    const m2p = new MonacoToProtocolConverter();
    const p2m = new ProtocolToMonacoConverter();
    return {
        languages: new MonacoLanguages(p2m, m2p),
        workspace: new MonacoWorkspace(m2p),
        window: new ConsoleWindow()
    }
}
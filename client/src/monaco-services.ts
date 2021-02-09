/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type * as monaco from 'monaco-editor-core';
import { MonacoToProtocolConverter, ProtocolToMonacoConverter } from "./monaco-converter";
import { MonacoCommands } from './monaco-commands';
import { MonacoLanguages } from "./monaco-languages";
import { MonacoWorkspace } from "./monaco-workspace";
import { ConsoleWindow } from "./console-window";
import { Services } from "./services";

export interface MonacoServices extends Services {
    commands: MonacoCommands
    languages: MonacoLanguages
    workspace: MonacoWorkspace
    window: ConsoleWindow
}
export namespace MonacoServices {
    export interface Options {
        rootUri?: string
    }
    export type Provider = () => MonacoServices;
    export function create(_monaco: typeof monaco, options: Options = {}): MonacoServices {
        const m2p = new MonacoToProtocolConverter(_monaco);
        const p2m = new ProtocolToMonacoConverter(_monaco);
        return {
            commands: new MonacoCommands(_monaco),
            languages: new MonacoLanguages(_monaco, p2m, m2p),
            workspace: new MonacoWorkspace(_monaco, p2m, m2p, options.rootUri),
            window: new ConsoleWindow()
        }
    }
    export function install(_monaco: typeof monaco, options: Options = {}): MonacoServices {
        const services = create(_monaco, options);
        Services.install(services);
        return services;
    }
    export function get(): MonacoServices {
        return Services.get() as MonacoServices;
    }
}
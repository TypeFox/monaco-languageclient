/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as cp from 'child_process';
import { ServerOptions } from 'ws';

export enum LanguageCli {
    /** https://nodejs.org/api/cli.html  */
    node = 'node',
    /** https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html */
    java = 'java'
}
export interface LanguageServerRunConfig {
    serverName: string;
    pathName: string;
    serverPort: number;
    runCommand: LanguageCli;
    runCommandArgs: string[];
    wsServerOptions: ServerOptions,
    spawnOptions?: cp.SpawnOptions;
}

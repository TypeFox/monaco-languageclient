/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */
import { Logger } from 'vscode-jsonrpc';

export class ConsoleLogger implements Logger {
    public error(message: string): void {
        console.error(message);
    }

    public warn(message: string): void {
        console.warn(message);
    }

    public info(message: string): void {
        console.info(message);
    }

    public log(message: string): void {
        console.log(message);
    }

    public debug(message: string): void {
        console.debug(message);
    }
}

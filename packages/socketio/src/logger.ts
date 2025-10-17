/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { Logger } from 'vscode-jsonrpc';

export type LogLevelValue = number;

export const LogLevel = {
    Off: 0 as LogLevelValue,
    Trace: 1 as LogLevelValue,
    Debug: 2 as LogLevelValue,
    Info: 3 as LogLevelValue,
    Warning: 4 as LogLevelValue,
    Error: 5 as LogLevelValue
};

export class ConsoleLogger implements Logger {

    private level: number = LogLevel.Off;

    constructor(level?: LogLevelValue | number) {
        this.level = level ?? LogLevel.Off;
    }

    public setLevel(level: LogLevelValue | number): void {
        this.level = level;
    }

    public log(message: string): void {
        if (LogLevel.Trace >= this.level) {
            console.log(message);
        }
    }

    public debug(message: string): void {
        if (LogLevel.Debug >= this.level) {
            console.debug(message);
        }
    }

    public info(message: string): void {
        if (LogLevel.Info >= this.level) {
            console.info(message);
        }
    }

    public warn(message: string): void {
        if (LogLevel.Warning >= this.level) {
            console.warn(message);
        }
    }

    public error(message: string): void {
        if (LogLevel.Error >= this.level) {
            console.error(message);
        }
    }

}

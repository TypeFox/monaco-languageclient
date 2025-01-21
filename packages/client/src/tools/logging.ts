/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ConsoleLogger as VSCodeConsoleLogger, type ILogger } from '@codingame/monaco-vscode-log-service-override';
import { LogLevel } from '@codingame/monaco-vscode-api';

export interface Logger extends ILogger {
    createErrorAndLog(message: string, ...params: unknown[]): Error;
}

export class ConsoleLogger extends VSCodeConsoleLogger {

    constructor(logLevel?: LogLevel, useColors?: boolean) {
        super(logLevel ?? LogLevel.Off, useColors);
    }

    createErrorAndLog(message: string, ...params: unknown[]) {
        if (this.getLevel() >= LogLevel.Error) {
            this.error(message, ...params);
        }
        return new Error(message);
    }

}

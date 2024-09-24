/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ConsoleLogger as VSCodeConsoleLogger, ILogger } from '@codingame/monaco-vscode-log-service-override';
import { LogLevel } from 'vscode/services';

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

export function checkLogLevel(logLevel?: string | number | unknown) {
    switch (logLevel) {
        case 'none':
        case 'Off':
        case 'off':
        case '0':
        case 0:
            return LogLevel.Off;
        case 'Trace':
        case 'trace':
        case '1':
        case 1:
            return LogLevel.Trace;
        case 'Debug':
        case 'debug':
        case '2':
        case 2:
            return LogLevel.Debug;
        case 'Info':
        case 'info':
        case '3':
        case 3:
            return LogLevel.Info;
        case 'Warning':
        case 'warning':
        case 'Warn':
        case 'warn':
        case '4':
        case 4:
            return LogLevel.Warning;
        case 'Error':
        case 'error':
        case '5':
        case 5:
            return LogLevel.Error;
        default:
            return LogLevel.Off;
    }
}

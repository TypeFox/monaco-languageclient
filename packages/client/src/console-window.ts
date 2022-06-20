/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { Window, Severity } from 'vscode/services';
import * as vscode from 'vscode';

export class ConsoleWindow implements Window {
    protected readonly channels = new Map<string, vscode.OutputChannel>();
    showMessage<T extends vscode.MessageOptions | string | vscode.MessageItem> (severity: Severity, message: string, ...actions: T[]): Thenable<T | undefined> {
        if (severity === Severity.Error) {
            console.error(message);
        }
        if (severity === Severity.Warning) {
            console.warn(message);
        }
        if (severity === Severity.Info) {
            console.info(message);
        }
        if (severity === Severity.Ignore) {
            console.debug(message);
        }
        return Promise.resolve(undefined);
    }

    createOutputChannel (name: string): vscode.OutputChannel {
        const existing = this.channels.get(name);
        if (existing) {
            return existing;
        }
        const channel: vscode.OutputChannel = {
            name: 'default',
            append (value: string): void {
                console.log(name + ': ' + value);
            },
            appendLine (line: string): void {
                console.log(name + ': ' + line);
            },
            show (): void {
                // no-op
            },
            dispose (): void {
                // no-op
            },
            replace: function (value: string): void {
                // no-op
            },
            clear: function (): void {
                // no-op
            },
            hide: function (): void {
                // no-op
            }
        };
        this.channels.set(name, channel);
        return channel;
    }
}

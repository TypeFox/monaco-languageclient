/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { MessageActionItem, MessageType } from 'vscode-base-languageclient/lib/protocol';
import { Window, OutputChannel } from 'vscode-base-languageclient/lib/services';

export class ConsoleWindow implements Window {
    protected readonly channels = new Map<string, OutputChannel>();
    showMessage<T extends MessageActionItem>(type: MessageType, message: string, ...actions: T[]): Thenable<T | undefined> {
        if (type === MessageType.Error) {
            console.error(message);
        }
        if (type === MessageType.Warning) {
            console.warn(message);
        }
        if (type === MessageType.Info) {
            console.info(message);
        }
        if (type === MessageType.Log) {
            console.log(message);
        }
        return Promise.resolve(undefined);
    }
    createOutputChannel(name: string): OutputChannel {
        const existing = this.channels.get(name);
        if (existing) {
            return existing;
        }
        const channel: OutputChannel = {
            append(value: string): void {
                console.log(name + ': ' + value);
            },
            appendLine(line: string): void {
                console.log(name + ': ' + line);
            },
            show(): void {
                // no-op
            }
        }
        this.channels.set(name, channel)
        return channel;
    }
}
/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Message } from 'vscode-jsonrpc/lib/common/messages.js';
import { AbstractMessageWriter, MessageWriter } from 'vscode-jsonrpc/lib/common/messageWriter.js';
import { IWebSocket } from './socket.js';

export class WebSocketMessageWriter extends AbstractMessageWriter implements MessageWriter {
    protected errorCount = 0;

    constructor(protected readonly socket: IWebSocket) {
        super();
    }

    end(): void {
    }

    async write(msg: Message): Promise<void> {
        try {
            const content = JSON.stringify(msg);
            this.socket.send(content);
        } catch (e) {
            this.errorCount++;
            this.fireError(e, msg, this.errorCount);
        }
    }
}

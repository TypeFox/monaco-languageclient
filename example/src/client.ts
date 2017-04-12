import { POINT_CONVERSION_COMPRESSED } from 'constants';
import { BaseLanguageClient, CloseAction, ErrorAction, ErrorHandler } from 'vscode-languageclient/lib/base';
import { createConnection } from "vscode-languageclient/lib/connection";
import {
    MonacoToProtocolConverter,  ProtocolToMonacoConverter,
    MonacoLanguages, MonacoWorkspace,
    listen, MessageConnection
 } from 'monaco-languageclient';

const ReconnectingWebSocket = require('reconnecting-websocket');

const m2p = new MonacoToProtocolConverter();
const p2m = new ProtocolToMonacoConverter();
const services: BaseLanguageClient.IServices = {
    languages: new MonacoLanguages(p2m, m2p),
    workspace: new MonacoWorkspace(m2p)
}

export function createLanguageClient(connection: MessageConnection): BaseLanguageClient {
    return new BaseLanguageClient({
        name: "Sample Language Client",
        clientOptions: {
            documentSelector: ["*.txt"],
            errorHandler: {
                error: () => ErrorAction.Continue,
                closed: () => CloseAction.DoNotRestart
            }
        },
        services,
        connectionProvider: {
            get: (errorHandler, closeHandler) => {
                return Promise.resolve(createConnection(connection, errorHandler, closeHandler))
            }
        }
    })
}

export function createUrl(path: string): string {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${location.host || "127.0.0.1:3000"}${path}`;
}

export function createWebSocket(url: string): WebSocket {
    const socketOptions = {
        maxReconnectionDelay: 10000,
        minReconnectionDelay: 1000,
        reconnectionDelayGrowFactor: 1.3,
        connectionTimeout: 10000,
        maxRetries: Infinity,
        debug: false
    };
    return new ReconnectingWebSocket(url, undefined, socketOptions);
}

const url = createUrl('/sampleServer')
const webSocket = createWebSocket(url);
listen({
    webSocket,
    onConnection: connection => {
        const languageClient = createLanguageClient(connection);
        const disposable = languageClient.start();
        connection.onClose(() => disposable.dispose());
    }
});

monaco.editor.create(document.getElementById("container")!, {
    model: monaco.editor.createModel("", undefined, monaco.Uri.parse("dummy://sample.txt"))
});

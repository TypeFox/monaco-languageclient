/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { WebSocketConfigOptionsParams, WebSocketConfigOptionsUrl } from 'monaco-languageclient';
import { createUrl } from 'monaco-languageclient/tools';

describe('createUrl', () => {

    test('test createUrl: ws', () => {
        const url = createUrl({
            secured: false,
            host: 'localhost',
            port: 30000,
            path: 'sampleServer'
        } as WebSocketConfigOptionsParams);

        expect(url).toBe('ws://localhost:30000/sampleServer');
    });

    test('test createUrl: wss', () => {
        const url = createUrl({
            secured: true,
            host: 'localhost',
            port: 30000,
            path: 'sampleServer'
        } as WebSocketConfigOptionsParams);

        expect(url).toBe('wss://localhost:30000/sampleServer');
    });

    test('test createUrl: wss, no port, with path', () => {
        const url = createUrl({
            secured: true,
            host: 'localhost',
            path: 'sampleServer'
        } as WebSocketConfigOptionsParams);

        expect(url).toBe('wss://localhost/sampleServer');
    });

    test('test createUrl: wss, with port, no path', () => {
        const url = createUrl({
            secured: true,
            host: 'localhost',
            port: 30000
        } as WebSocketConfigOptionsParams);

        expect(url).toBe('wss://localhost:30000');
    });

    test('test createUrl: wss, no port, no path', () => {
        const url = createUrl({
            secured: true,
            host: 'localhost'
        } as WebSocketConfigOptionsParams);

        expect(url).toBe('wss://localhost');
    });

    test('test createUrl: ws, normalize port 80', () => {
        const url = createUrl({
            secured: false,
            host: 'localhost',
            port: 80
        } as WebSocketConfigOptionsParams);

        expect(url).toBe('ws://localhost');
    });

    test('test createUrl: ws, normalize port 80, with path', () => {
        const url = createUrl({
            secured: false,
            host: 'localhost',
            port: 80,
            path: 'sampleServer'
        } as WebSocketConfigOptionsParams);

        expect(url).toBe('ws://localhost/sampleServer');
    });

    test('test createUrl: optionsUrl: ws', () => {
        const url = createUrl({
            url: 'ws://localhost:30000/sampleServer'
        } as WebSocketConfigOptionsUrl);

        expect(url).toBe('ws://localhost:30000/sampleServer');
    });

    test('test createUrl: optionsUrl: wss', () => {
        const url = createUrl({
            url: 'wss://localhost:30000/sampleServer'
        } as WebSocketConfigOptionsUrl);

        expect(url).toBe('wss://localhost:30000/sampleServer');
    });

    test('test createUrl: optionsUrl, with port, no path', () => {
        const url = createUrl({
            url: 'wss://localhost:30000'
        } as WebSocketConfigOptionsUrl);

        expect(url).toBe('wss://localhost:30000');
    });

    test('test createUrl: optionsUrl, no port, with path', () => {
        const url = createUrl({
            url: 'ws://localhost/sampleServer'
        } as WebSocketConfigOptionsUrl);

        expect(url).toBe('ws://localhost/sampleServer');
    });

    test('test createUrl: optionsUrl, no port, no path', () => {
        const url = createUrl({
            url: 'wss://www.testme.com'
        } as WebSocketConfigOptionsUrl);

        expect(url).toBe('wss://www.testme.com');
    });

    test('test createUrl: ws, not proper url', () => {
        expect(() => createUrl({
            url: 'http://www.testme.com:30000/sampleServer'
        } as WebSocketConfigOptionsUrl)).toThrowError('This is not a proper websocket url: http://www.testme.com:30000/sampleServer');
    });

});

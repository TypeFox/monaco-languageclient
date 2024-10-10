/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { EmptyFileSystemEndpoint, EndpointType } from 'monaco-languageclient/fs';

describe('EmptyFileSystemEndpoint Tests', () => {

    const endpoint = new EmptyFileSystemEndpoint(EndpointType.EMPTY);

    test('readFile', async () => {
        const result = await endpoint.readFile({ resourceUri: '/tmp/test.js' });
        expect(result).toEqual({
            status: 'denied',
            content: ''
        });
    });

    test('writeFile', async () => {
        const result = await endpoint.writeFile({
            resourceUri: '/tmp/test.js',
            content: 'console.log("Hello World!");'
        });
        expect(result).toEqual({
            status: 'denied'
        });
    });

    test('syncFile', async () => {
        const result = await endpoint.syncFile({
            resourceUri: '/tmp/test.js',
            content: 'console.log("Hello World!");'
        });
        expect(result).toEqual({
            status: 'denied'
        });
    });

    test('getFileStats', async () => {
        expect(async () => {
            await endpoint.getFileStats({
                type: 'file',
                resourceUri: '/tmp/test.js'
            });
        }).rejects.toThrowError('No stats available.');
    });

    test('listFiles', async () => {
        expect(async () => {
            await endpoint.listFiles({
                directoryUri: '/tmp'
            });
        }).rejects.toThrowError('No file listing possible.');
    });

});

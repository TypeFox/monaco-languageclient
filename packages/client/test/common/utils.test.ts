/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/// <reference types="vite/client" />

import { describe, expect, test } from 'vitest';
import { createUrl, type WebSocketConfigOptionsParams, type WebSocketConfigOptionsUrl } from 'monaco-languageclient/common';

const hostname = import.meta.env.VITE_HOSTNAME_LS;

describe('createUrl', { tags: ['main'] }, () => {
  test('test createUrl: ws', () => {
    const url = createUrl({
      secured: false,
      host: `${hostname}`,
      port: 30000,
      path: 'sampleServer'
    } as WebSocketConfigOptionsParams);

    expect(url).toBe(`ws://${hostname}:30000/sampleServer`);
  });

  test('test createUrl: wss', () => {
    const url = createUrl({
      secured: true,
      host: `${hostname}`,
      port: 30000,
      path: 'sampleServer'
    } as WebSocketConfigOptionsParams);

    expect(url).toBe(`wss://${hostname}:30000/sampleServer`);
  });

  test('test createUrl: wss, no port, with path', () => {
    const url = createUrl({
      secured: true,
      host: `${hostname}`,
      path: 'sampleServer'
    } as WebSocketConfigOptionsParams);

    expect(url).toBe(`wss://${hostname}/sampleServer`);
  });

  test('test createUrl: wss, with port, no path', () => {
    const url = createUrl({
      secured: true,
      host: `${hostname}`,
      port: 30000
    } as WebSocketConfigOptionsParams);

    expect(url).toBe(`wss://${hostname}:30000`);
  });

  test('test createUrl: wss, no port, no path', () => {
    const url = createUrl({
      secured: true,
      host: `${hostname}`
    } as WebSocketConfigOptionsParams);

    expect(url).toBe(`wss://${hostname}`);
  });

  test('test createUrl: ws, normalize port 80', () => {
    const url = createUrl({
      secured: false,
      host: `${hostname}`,
      port: 80
    } as WebSocketConfigOptionsParams);

    expect(url).toBe(`ws://${hostname}`);
  });

  test('test createUrl: ws, normalize port 80, with path', () => {
    const url = createUrl({
      secured: false,
      host: `${hostname}`,
      port: 80,
      path: 'sampleServer'
    } as WebSocketConfigOptionsParams);

    expect(url).toBe(`ws://${hostname}/sampleServer`);
  });

  test('test createUrl: optionsUrl: ws', () => {
    const url = createUrl({
      webSocketUrl: `ws://${hostname}:30000/sampleServer`
    } as WebSocketConfigOptionsUrl);

    expect(url).toBe(`ws://${hostname}:30000/sampleServer`);
  });

  test('test createUrl: optionsUrl: wss', () => {
    const url = createUrl({
      webSocketUrl: `wss://${hostname}:30000/sampleServer`
    } as WebSocketConfigOptionsUrl);

    expect(url).toBe(`wss://${hostname}:30000/sampleServer`);
  });

  test('test createUrl: optionsUrl, with port, no path', () => {
    const url = createUrl({
      webSocketUrl: `wss://${hostname}:30000`
    } as WebSocketConfigOptionsUrl);

    expect(url).toBe(`wss://${hostname}:30000`);
  });

  test('test createUrl: optionsUrl, no port, with path', () => {
    const url = createUrl({
      webSocketUrl: `ws://${hostname}/sampleServer`
    } as WebSocketConfigOptionsUrl);

    expect(url).toBe(`ws://${hostname}/sampleServer`);
  });

  test('test createUrl: optionsUrl, no port, no path', () => {
    const url = createUrl({
      webSocketUrl: 'wss://www.testme.com'
    } as WebSocketConfigOptionsUrl);

    expect(url).toBe('wss://www.testme.com');
  });

  test('test createUrl: ws, not proper url', () => {
    expect(() =>
      createUrl({
        webSocketUrl: 'http://www.testme.com:30000/sampleServer'
      } as WebSocketConfigOptionsUrl)
    ).toThrowError('This is not a proper websocket url: http://www.testme.com:30000/sampleServer');
  });
});

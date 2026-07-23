/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Deferred } from 'monaco-languageclient/common';
import { LanguageClientWrapper, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { describe, expect, test } from 'vitest';
import { LogLevel, SocketIoMessageReader, SocketIoMessageWriter } from 'vscode-socketio-jsonrpc';
import { SocketIoClient } from 'vscode-socketio-jsonrpc/browser';
import type { LsCommandFeedback } from '../support/command-args.js';

export const createMonacoEditorDiv = () => {
  const div = document.createElement('div');
  div.id = 'monaco-editor-root';
  document.body.insertAdjacentElement('beforeend', div);
  return div;
};

describe.concurrent('socketio', { concurrent: false }, () => {
  test('test direct', { tags: ['main'] }, async () => {
    const socketIoClient = new SocketIoClient({
      url: 'ws://localhost:30101'
    });
    const socket = socketIoClient.start();

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(socket).toBeDefined();

    socket.disconnect();
  });

  test('Test LSP connection with LanguageClientWrapper', { tags: ['main'] }, async () => {
    const apiConfig: MonacoVscodeApiConfig = {
      $type: 'extended',
      viewsConfig: {
        $type: 'EditorService',
        htmlContainer: createMonacoEditorDiv()
      }
    };
    const monacoVscodeApiManager = new MonacoVscodeApiWrapper(apiConfig);
    await monacoVscodeApiManager.start();

    const socketIoClient = new SocketIoClient({
      url: 'ws://localhost:30102'
    });
    const socket = socketIoClient.start();

    const lcConfig: LanguageClientConfig = {
      languageId: 'javascript',
      clientOptions: {
        documentSelector: ['javascript']
      },
      connection: {
        options: {
          $family: 'WebSocket',
          $type: 'SocketIoDirect',
          webSocket: socket
        },
        messageTransports: {
          reader: new SocketIoMessageReader(socket),
          writer: new SocketIoMessageWriter(socket)
        }
      }
    };
    const languageClientWrapper = new LanguageClientWrapper(lcConfig);

    expect(async () => await languageClientWrapper.start()).not.toThrow();

    await languageClientWrapper.dispose();
    socket.disconnect();
  });

  test('Test Commanding Dummy Language Server', { tags: ['main'] }, async () => {
    const socketIoClient = new SocketIoClient({
      url: 'ws://localhost:30200',
      logLevel: LogLevel.Debug
    });
    const socket = socketIoClient.start();
    const commandArgs = { ls: 'dummy' };

    const deferredStart = new Deferred();
    socket.emit('ls:start', commandArgs, (response: LsCommandFeedback) => {
      expect(response.status).toBe('OK');
      expect(response.message).toBe('Language server started.');
      console.info('ls:start feedback:', response);
      deferredStart.resolve();
    });
    await deferredStart.promise;

    const deferredStartedAlready = new Deferred();
    socket.emit('ls:start', commandArgs, (response: LsCommandFeedback) => {
      expect(response.status).toBe('OK');
      expect(response.message).toBe('Language server was already started.');
      console.info('ls:start feedback:', response);
      deferredStartedAlready.resolve();
    });
    await deferredStartedAlready.promise;

    const deferredStop = new Deferred();
    socket.emit('ls:stop', commandArgs, (response: LsCommandFeedback) => {
      expect(response.status).toBe('OK');
      expect(response.message).toBe('Language server was stopped.');
      console.info('ls:stop feedback:', response);
      deferredStop.resolve();
    });
    await deferredStop.promise;

    socket.disconnect();
  });

  test('Test Commanding Statemachine Language Server', { tags: ['main'] }, async () => {
    const socketIoClient = new SocketIoClient({
      url: 'ws://localhost:30200',
      logLevel: LogLevel.Debug
    });
    const socket = socketIoClient.start();
    const commandArgs = { ls: 'statemachine' };

    const deferredStart = new Deferred();
    socket.emit('ls:start', commandArgs, (response: LsCommandFeedback) => {
      expect(response.status).toBe('OK');
      expect(response.message).toBe('Language server started.');
      console.info('ls:start feedback:', response);
      deferredStart.resolve();
    });
    await deferredStart.promise;

    const deferredStartedAlready = new Deferred();
    socket.emit('ls:start', commandArgs, (response: LsCommandFeedback) => {
      expect(response.status).toBe('OK');
      expect(response.message).toBe('Language server was already started.');
      console.info('ls:start feedback:', response);
      deferredStartedAlready.resolve();
    });
    await deferredStartedAlready.promise;

    const deferredStop = new Deferred();
    socket.emit('ls:stop', commandArgs, (response: LsCommandFeedback) => {
      expect(response.status).toBe('OK');
      expect(response.message).toBe('Language server was stopped.');
      console.info('ls:stop feedback:', response);
      deferredStop.resolve();
    });
    await deferredStop.promise;

    socket.disconnect();
  });

  test('Test Commanding Server Shutdown', { tags: ['commander'] }, async () => {
    const socketIoClient = new SocketIoClient({
      url: 'ws://localhost:30200',
      logLevel: LogLevel.Debug
    });
    const socket = socketIoClient.start();
    const commandArgs = {};

    const deferredStart = new Deferred();
    socket.emit('shutdown', commandArgs, (response: LsCommandFeedback) => {
      expect(response.status).toBe('OK');
      expect(response.message).toBe('Shutting down in 100ms.');
      console.info('shutdown feedback:', response);
      deferredStart.resolve();
    });
    await deferredStart.promise;

    socket.disconnect();
  });
});

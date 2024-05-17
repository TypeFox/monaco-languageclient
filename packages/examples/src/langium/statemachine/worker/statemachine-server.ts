/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/// <reference lib="WebWorker" />

import { start } from './statemachine-server-start.js';

declare const self: DedicatedWorkerGlobalScope;

start(self, 'statemachine-server');

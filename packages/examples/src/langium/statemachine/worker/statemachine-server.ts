/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { start } from './statemachine-server-start.js';

declare const self: DedicatedWorkerGlobalScope;

start(self, 'statemachine-server');

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { start } from './statemachine-server-start.js';

declare const self: DedicatedWorkerGlobalScope;

start(self, 'statemachine-server');

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { configureMonacoWorkers, runJsonWrapper } from 'monaco-languageclient-examples/json-client';

configureMonacoWorkers();
runJsonWrapper();

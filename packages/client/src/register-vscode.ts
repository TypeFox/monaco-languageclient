/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';

const Module = module.parent!.require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (this: any, id: string, options: any) {
    const resolvedId = id === 'vscode' ? path.resolve(__dirname, 'vscode-compatibility.js') : id;
    return originalRequire.call(this, resolvedId, options);
};
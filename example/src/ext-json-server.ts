/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node';
import { start } from "./json-server";

const reader = new StreamMessageReader(process.stdin);
const writer = new StreamMessageWriter(process.stdout);
start(reader, writer);

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { resolve } from 'node:path';
import { runGroovyLanguageServer } from './main.js';
import { getLocalDirectory } from '../../common/node/server-commons.js';

const baseDir = resolve(getLocalDirectory(import.meta.url));
const groovyJar = resolve(baseDir, '../../../resources/groovy/external/groovy-language-server-all.jar');
const relativeDir = process.env.LANG_SERVER_JAR_PATH || groovyJar;
console.log(`basedir: ${baseDir}`);
console.log(`groovyJar: ${groovyJar}`);
console.log(`LANG_SERVER_JAR_PATH: ${process.env.LANG_SERVER_JAR_PATH}`);
console.log(`relativeDir: ${relativeDir}`);

runGroovyLanguageServer(baseDir, relativeDir);

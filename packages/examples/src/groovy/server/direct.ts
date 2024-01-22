/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { resolve } from 'path';
import { getLocalDirectory } from '../../utils/fs-utils.js';
import { runGroovyLanguageServer } from './main.js';
const baseDir = resolve(getLocalDirectory(import.meta.url));

const groovyJar = resolve(baseDir, '../../../resources/groovy/external/groovy-language-server-all.jar');
const relativeDir = process.env.LANG_SERVER_JAR_PATH || groovyJar;
console.log(`basedir: ${baseDir}`);
console.log(`groovyJar: ${groovyJar}`);
console.log(`LANG_SERVER_JAR_PATH: ${process.env.LANG_SERVER_JAR_PATH}`);
console.log(`relativeDir: ${relativeDir}`);

runGroovyLanguageServer(baseDir, relativeDir);

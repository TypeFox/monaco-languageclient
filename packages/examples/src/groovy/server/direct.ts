/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { resolve } from 'path';
import { getLocalDirectory } from '../../utils/fs-utils.js';
import { runGroovyLanguageServer } from './main.js';
const baseDir = resolve(getLocalDirectory(import.meta.url));
/**
 * git clone https://github.com/GroovyLanguageServer/groovy-language-server
 * then run `./gradlew build`
 * copy the jar file from `groovy-language-server/build/libs/groovy-language-server-all.jar` to `packages/examples/src/groovy/server`
 */
const relativeDir = process.env.LANG_SERVER_JAR_PATH || '';
runGroovyLanguageServer(baseDir, relativeDir);

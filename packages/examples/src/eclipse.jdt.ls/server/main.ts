/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { runLanguageServer } from '../../common/node/language-server-runner.js';
import { eclipseJdtLsConfig } from '../config.js';

export const runEclipseJdtLs = () => {
  runLanguageServer({
    serverName: 'Eclipse JDT LS',
    pathName: eclipseJdtLsConfig.path,
    serverPort: eclipseJdtLsConfig.port,
    runCommand: 'java',
    runCommandArgs: [
      '-Declipse.application=org.eclipse.jdt.ls.core.id1',
      '-Dosgi.bundles.defaultStartLevel=4',
      '-Declipse.product=org.eclipse.jdt.ls.core.product',
      '-Dlog.level=ALL',
      '-Xmx1G',
      '--add-modules=ALL-SYSTEM',
      '--add-opens',
      'java.base/java.util=ALL-UNNAMED',
      '--add-opens',
      'java.base/java.lang=ALL-UNNAMED',
      '-jar',
      `${eclipseJdtLsConfig.basePathServer}/plugins/org.eclipse.equinox.launcher_1.8.0.v20260804-1928.jar`,
      '-configuration',
      `${eclipseJdtLsConfig.basePathServer}/config_linux`,
      '-data',
      `${eclipseJdtLsConfig.basePathClient}/workspace`
    ],
    wsServerOptions: {
      noServer: true,
      perMessageDeflate: false
    }
  });
};

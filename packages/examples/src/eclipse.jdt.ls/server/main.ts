/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { runLanguageServer } from '../../common/node/language-server-runner.js';
import { LanguageName } from '../../common/node/server-commons.js';
import { eclipseJdtLsConfig } from '../config.js';

export const runEclipseJdtLs = () => {
    runLanguageServer({
        serverName: 'Eclipse JDT LS',
        pathName: eclipseJdtLsConfig.path,
        serverPort: eclipseJdtLsConfig.port,
        runCommand: LanguageName.java,
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
            `${eclipseJdtLsConfig.basePath}/ls/plugins/org.eclipse.equinox.launcher_1.6.900.v20240613-2009.jar`,
            '-configuration',
            `${eclipseJdtLsConfig.basePath}/ls/config_linux`,
            '-data',
            `${eclipseJdtLsConfig.basePath}/workspace`
        ],
        wsServerOptions: {
            noServer: true,
            perMessageDeflate: false
        }
    });
};

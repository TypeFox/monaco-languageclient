/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { writeFileSync } from 'fs';

export const fetchRemoteTheme = async (url: string, targetFile: string) => {
    const res = await fetch(url);
    res.text().then(x => {
        writeFileSync(targetFile, x);
    });
};

// re-fectch required themes
export const fetchAllThemesFromGitHub = async (targetDir: string) => {
    // light
    fetchRemoteTheme('https://raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/light_vs.json', targetDir + '/light_vs.json');
    fetchRemoteTheme('https://raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/light_plus.json', targetDir + '/light_plus.json');
    fetchRemoteTheme('https://raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/light_plus_experimental.json', targetDir + '/light_plus_experimental.json');
    fetchRemoteTheme('https://raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/hc_light.json', targetDir + '/hc_light.json');

    // dark
    fetchRemoteTheme('https://raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/dark_vs.json', targetDir + '/dark_vs.json');
    fetchRemoteTheme('https://raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/dark_plus.json', targetDir + '/dark_plus.json');
    fetchRemoteTheme('https://raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/dark_plus_experimental.json', targetDir + '/dark_plus_experimental.json');
    fetchRemoteTheme('https://raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/hc_black.json', targetDir + '/hc_black.json');
};

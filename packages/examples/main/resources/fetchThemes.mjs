/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { writeFileSync } from 'fs';

const getTheme = async (url, targetFile) => {
    const res = await fetch(url);
    res.text().then(x => {
        writeFileSync(targetFile, x);
    });
};

// re-fectch required themes

// light
getTheme('https://raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/light_vs.json', './resources/themes/light_vs.json');
getTheme('https://raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/light_plus.json', './resources/themes/light_plus.json');
getTheme('https://raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/light_plus_experimental.json', './resources/themes/light_plus_experimental.json');

// dark
getTheme('https://raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/dark_vs.json', './resources/themes/dark_vs.json');
getTheme('https://raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/dark_plus.json', './resources/themes/dark_plus.json');
getTheme('https://raw.githubusercontent.com/microsoft/vscode/main/extensions/theme-defaults/themes/dark_plus_experimental.json', './resources/themes/dark_plus_experimental.json');

/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { IThemeExtensionPoint, setDefaultThemes } from 'vscode/service-override/theme';

export const loadDefaultThemes = async () => {
    const themesUrl = new URL('./resources/themes.json', window.location.href).href;
    const responseThemesJson = await fetch(themesUrl);
    const themeLightVsUrl = new URL('./resources/themes/light_vs.json', window.location.href).href;
    const themeLightPlusUrl = new URL('./resources/themes/light_plus.json', window.location.href).href;
    const themeLightPlusExpUrl = new URL('./resources/themes/light_plus_experimental.json', window.location.href).href;
    const themeDarkVsUrl = new URL('./resources/themes/dark_vs.json', window.location.href).href;
    const themeDarkPlusUrl = new URL('./resources/themes/dark_plus.json', window.location.href).href;
    const themeDarkPlusExpUrl = new URL('./resources/themes/dark_plus_experimental.json', window.location.href).href;

    const themes = JSON.parse(await responseThemesJson.text()) as IThemeExtensionPoint[];
    const responseThemeLightVs = await fetch(themeLightVsUrl);
    const responseThemeLightPlus = await fetch(themeLightPlusUrl);
    const responseThemeLightPlusExp = await fetch(themeLightPlusExpUrl);
    const responseThemeDarkVs = await fetch(themeDarkVsUrl);
    const responseThemeDarkPlus = await fetch(themeDarkPlusUrl);
    const responseThemeDarkPlusExp = await fetch(themeDarkPlusExpUrl);

    setDefaultThemes(themes, (theme) => {
        switch (theme.path) {
            case './themes/light_vs.json':
                return responseThemeLightVs.text();
            case './themes/light_plus.json':
                return responseThemeLightPlus.text();
            case './themes/light_plus_experimental.json':
                return responseThemeLightPlusExp.text();
            case './themes/dark_vs.json':
                return responseThemeDarkVs.text();
            case './themes/dark_plus.json':
                return responseThemeDarkPlus.text();
            case './themes/dark_plus_experimental.json':
                return responseThemeDarkPlusExp.text();
            default:
                return Promise.reject(new Error(`Theme ${theme.path} not found`));
        }
    });
};

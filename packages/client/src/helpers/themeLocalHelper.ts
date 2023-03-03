/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { IThemeExtensionPoint, setDefaultThemes } from 'vscode/service-override/theme';

const createThemesDefintion = () => {
    return [
        {
            id: 'Visual Studio Light',
            label: 'Light (Visual Studio)',
            uiTheme: 'vs-light',
            path: './themes/light_vs.json',
            extension: 'theme-defaults'
        },
        {
            id: 'Default Light+',
            label: 'Light+ (default light)',
            uiTheme: 'vs-light',
            path: './themes/light_plus.json',
            extension: 'theme-defaults'
        },
        {
            id: 'Light+ (Experimental)',
            label: 'Light+ (Experimental)',
            uiTheme: 'vs-light',
            path: './themes/light_plus_experimental.json',
            extension: 'theme-defaults'
        },
        {
            id: 'Default High Contrast Light',
            label: 'High Contrast Light',
            uiTheme: 'hc-light',
            path: './themes/hc_light.json'
        },
        {
            id: 'Visual Studio Dark',
            label: 'Dark (Visual Studio)',
            uiTheme: 'vs-dark',
            path: './themes/dark_vs.json',
            extension: 'theme-defaults'
        },
        {
            id: 'Default Dark+',
            label: 'Dark+ (default dark)',
            uiTheme: 'vs-dark',
            path: './themes/dark_plus.json',
            extension: 'theme-defaults'
        },
        {
            id: 'Dark+ (Experimental)',
            label: 'Dark+ (Experimental)',
            uiTheme: 'vs-dark',
            path: './themes/dark_plus_experimental.json',
            extension: 'theme-defaults'
        },
        {
            id: 'Default High Contrast Dark',
            label: 'High Contrast Dark',
            uiTheme: 'hc-black',
            path: './themes/hc_black.json'
        }
    ] as IThemeExtensionPoint[];
};

const fetchLocalTheme = async (url: string) => {
    const resp = await fetch(url);
    return resp.text();
};

export const loadAllDefaultThemes = async (targetDir: string) => {
    const themeLightVsUrl = new URL(targetDir + '/light_vs.json', window.location.href).href;
    const themeLightPlusUrl = new URL(targetDir + '/light_plus.json', window.location.href).href;
    const themeLightPlusExpUrl = new URL(targetDir + '/light_plus_experimental.json', window.location.href).href;
    const themeLightHcUrl = new URL(targetDir + '/hc_light.json', window.location.href).href;
    const themeDarkVsUrl = new URL(targetDir + '/dark_vs.json', window.location.href).href;
    const themeDarkPlusUrl = new URL(targetDir + '/dark_plus.json', window.location.href).href;
    const themeDarkPlusExpUrl = new URL(targetDir + '/dark_plus_experimental.json', window.location.href).href;
    const themeDarkHcUrl = new URL(targetDir + '/hc_black.json', window.location.href).href;

    setDefaultThemes(createThemesDefintion(), (theme) => {
        switch (theme.path) {
            case './themes/light_vs.json':
                return fetchLocalTheme(themeLightVsUrl);
            case './themes/light_plus.json':
                return fetchLocalTheme(themeLightPlusUrl);
            case './themes/light_plus_experimental.json':
                return fetchLocalTheme(themeLightPlusExpUrl);
            case './themes/hc_light.json':
                return fetchLocalTheme(themeLightHcUrl);
            case './themes/dark_vs.json':
                return fetchLocalTheme(themeDarkVsUrl);
            case './themes/dark_plus.json':
                return fetchLocalTheme(themeDarkPlusUrl);
            case './themes/dark_plus_experimental.json':
                return fetchLocalTheme(themeDarkPlusExpUrl);
            case './themes/hc_dark.json':
                return fetchLocalTheme(themeDarkHcUrl);
            default:
                return Promise.reject(new Error(`Theme ${theme.path} not found`));
        }
    });
};

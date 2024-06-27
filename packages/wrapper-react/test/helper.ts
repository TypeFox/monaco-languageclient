/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { EditorAppClassic, EditorAppExtended } from 'monaco-editor-wrapper';

export const updateExtendedAppPrototyp = async () => {
    EditorAppExtended.prototype.specifyServices = async () => {
        console.log('Using overriden EditorAppExtended.prototype.specifyServices');
        return Promise.resolve({});
    };
    EditorAppClassic.prototype.specifyServices = async () => {
        console.log('Using overriden EditorAppClassic.prototype.specifyServices');
        return Promise.resolve({});
    };
};

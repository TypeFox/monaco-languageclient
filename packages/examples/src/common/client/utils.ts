/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

export const disableButton = (id: string, disabled: boolean) => {
    const button = document.getElementById(id) as HTMLButtonElement | null;
    if (button !== null) {
        button.disabled = disabled;
    }
};

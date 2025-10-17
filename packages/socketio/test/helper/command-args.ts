/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

export type LsCommands = 'ls:start' | 'ls:stop' | string;

export type LsCommandArgs = {
    ls: string;
};

export type CommandStatus = 'OK' | 'ERROR';

export type LsCommandFeedback = {
    status: CommandStatus;
    message: string;
}

export type CommandCallback = (response: LsCommandFeedback) => void;

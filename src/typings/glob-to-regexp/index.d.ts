/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
declare module "glob-to-regexp" {
    namespace globToRegExp {}
    function globToRegExp(glob: string, opts?: {
        extended?: boolean;
        globstar?: boolean;
        flags?: string;
    }): RegExp;
    export = globToRegExp;
}

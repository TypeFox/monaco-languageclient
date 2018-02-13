declare module "glob-to-regexp" {
    namespace globToRegExp {}
    function globToRegExp(glob: string, opts?: {
        extended?: boolean;
        globstar?: boolean;
        flags?: string;
    }): RegExp;
    export = globToRegExp;
}

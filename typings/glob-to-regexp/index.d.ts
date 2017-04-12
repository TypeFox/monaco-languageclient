declare module "glob-to-regexp" {
    export default function globToRegExp(glob: string, opts?: {
        extended?: boolean;
        globstar?: boolean;
        flags?: string;
    }): RegExp;
}

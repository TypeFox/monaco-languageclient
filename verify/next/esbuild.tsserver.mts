import * as esbuild from 'esbuild';

const ctx = await esbuild.context({
    entryPoints: ['./node_modules/@codingame/monaco-vscode-typescript-language-features-default-extension/index.js'],
    outdir: 'bundle',
    bundle: true,
    target: 'ES2022',
    format: 'esm',
    platform: 'node',
    sourcemap: true
});

await ctx.rebuild();
ctx.dispose();

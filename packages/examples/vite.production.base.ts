import { UserConfig } from 'vite';
import vsixPlugin from '@codingame/monaco-vscode-rollup-vsix-plugin';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export const buildBaseProductionConfig: () => UserConfig = () => {
    return {
        build: {
            target: 'esnext',
            rollupOptions: {
                input: {
                    index: path.resolve(__dirname, 'index.html'),
                    browser: path.resolve(__dirname, 'browser.html'),
                    langium: path.resolve(__dirname, 'langium.html'),
                    statemachine: path.resolve(__dirname, 'statemachine.html'),
                    clangd: path.resolve(__dirname, 'clangd.html'),
                    reactStatemachine: path.resolve(__dirname, 'react_statemachine.html'),
                    appPlayground: path.resolve(__dirname, 'appPlayground.html'),
                    tsExtHost: path.resolve(__dirname, 'tsExtHost.html')
                }
            },
            emptyOutDir: false,
            assetsInlineLimit: 0,
            outDir: path.resolve(__dirname, 'production')
        },
        plugins: [
            vsixPlugin(),
            viteStaticCopy({
                targets: [
                    {
                        src: 'resources/clangd/wasm/clangd.js',
                        dest: 'assets'
                    },
                    {
                        src: 'resources/clangd/wasm/clangd.worker.mjs',
                        dest: 'assets'
                    }
                ]
            })
        ],
        worker: {
            format: 'es'
        },
        esbuild: {
            minifySyntax: false
        }
    };
}

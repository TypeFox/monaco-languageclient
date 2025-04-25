import { UserConfig } from 'vite';
import vsixPlugin from '@codingame/monaco-vscode-rollup-vsix-plugin';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export const buildBaseProductionConfig: () => UserConfig = () => {
    return {
        build: {
            target: 'ES2022',
            rollupOptions: {
                input: {
                    index: path.resolve(__dirname, 'index.html'),
                    langiumExtended: path.resolve(__dirname, 'ghp_langium_extended.html'),
                    statemachine: path.resolve(__dirname, 'ghp_statemachine.html'),
                    clangd: path.resolve(__dirname, 'ghp_clangd.html'),
                    appPlayground: path.resolve(__dirname, 'ghp_appPlayground.html'),
                    browser: path.resolve(__dirname, 'ghp_browser.html'),
                    tsExtHost: path.resolve(__dirname, 'ghp_tsExtHost.html'),
                    reactAppPlayground: path.resolve(__dirname, 'ghp_react_appPlayground.html'),
                    reactStatemachine: path.resolve(__dirname, 'ghp_react_statemachine.html')
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

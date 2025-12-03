import angular from '@analogjs/vite-plugin-angular';
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
    console.log(`Running: ${command}`);
    return {
        build: {
            emptyOutDir: true,
            assetsInlineLimit: 0,
            outDir: path.resolve(__dirname, 'production')
        },
        worker: {
            format: 'es'
        },
        esbuild: {
            minifySyntax: false
        },
        plugins: [
            angular()
        ],
        optimizeDeps: {
            esbuildOptions: {
                plugins: [
                    importMetaUrlPlugin
                ]
            },
            include: [
                'vscode/localExtensionHost',
                'vscode-jsonrpc',
                'vscode-languageclient',
                'vscode-languageserver',
                'vscode-languageserver/browser.js',
                'vscode-languageserver-protocol',
                'vscode-oniguruma',
                'vscode-textmate'
            ]
        },
        server: {
            port: 8084,
            cors: {
                origin: '*'
            },
            headers: {
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Cross-Origin-Embedder-Policy': 'require-corp',
            }
        },
    };
});

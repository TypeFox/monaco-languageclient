import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(({ command }) => {
    console.log(`Running: ${command}`);
    return {
        build: {
            lib: {
                entry: path.resolve(__dirname, 'bundle', 'index.ts'),
                fileName: 'mlc-bundle',
                name: 'mlc-bundle',
                formats: ['es']
            },
            emptyOutDir: true,
            assetsInlineLimit: 0,
            outDir: path.resolve(__dirname, 'production')
        },
        worker: {
            format: 'es'
        },
        esbuild: {
            minifySyntax: false
        }
    };
});

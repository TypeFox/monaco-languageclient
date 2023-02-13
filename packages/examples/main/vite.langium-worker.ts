import { resolve } from 'path';
import { defineConfig } from 'vite';

const config = defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, '../../../node_modules/langium-statemachine-dsl/src/language-server/main-browser.ts'),
            name: 'statemachineServerWorker',
            fileName: () => 'statemachineServerWorker.js',
            formats: ['iife']
        },
        outDir: resolve(__dirname, 'dist/worker/'),
        emptyOutDir: true
    }
});

export default config;

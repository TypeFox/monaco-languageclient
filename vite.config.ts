import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                client: path.resolve(__dirname, '/packages/examples/client/index.html'),
                browserLsp: path.resolve(__dirname, '/packages/examples/browser-lsp/index.html'),
                browser: path.resolve(__dirname, '/packages/examples/browser/index.html'),
                browserOld: path.resolve(__dirname, '/packages/examples/browser-old/index.html')
            }
        }
    },
    server: {
        port: 8080
    }
});

import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: [
            {
                find: 'vscode',
                replacement: path.resolve(__dirname, './node_modules/monaco-languageclient/lib/vscode-compatibility')
            }
        ]
    },
    optimizeDeps: {
        // we need this as it is locally referenced/linked by the examples
        // if it is regular dependency resolved from npmjs this is not required
        include: ['monaco-languageclient']
    },
    build: {
        rollupOptions: {
            input: {
                client: path.resolve(__dirname, '/packages/examples/client/index.html'),
                browser: path.resolve(__dirname, '/packages/examples/browser/index.html')
            }
        },
        commonjsOptions: {
            include: [/monaco-languageclient/, /node_modules/]
        }
    },
    server: {
        port: 8080
    }
});

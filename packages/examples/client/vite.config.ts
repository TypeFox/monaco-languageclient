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
    server: {
        port: 8080
    }
});

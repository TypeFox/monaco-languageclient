/* eslint-disable header/header */
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';

export default defineConfig(() => {
    const config = {
        build: {
            rollupOptions: {
                input: {
                    client: resolve(__dirname, 'packages/examples/main/client.html'),
                    statemachineClient: resolve(__dirname, 'packages/examples/main/statemachine_client.html'),
                    browser: resolve(__dirname, 'packages/examples/main/browser.html'),
                    react: resolve(__dirname, 'packages/examples/main/react.html'),
                    python: resolve(__dirname, 'packages/examples/main/python.html')
                }
            }
        },
        resolve: {
            alias: {
                path: 'path-browserify'
            }
        },
        server: {
            port: 8080,
            origin: 'http://localhost:8080'
        },
        optimizeDeps: {
            esbuildOptions: {
                plugins: [
                    // copied from "https://github.com/CodinGame/monaco-vscode-api/blob/run-ext-host-in-worker/demo/vite.config.ts"
                    {
                        name: 'import.meta.url',
                        setup({ onLoad }) {
                            // Help vite that bundles/move files without touching `import.meta.url` which breaks asset urls
                            onLoad({ filter: /default-extensions\/.*\.js/, namespace: 'file' }, args => {
                                let code = readFileSync(args.path, 'utf8');
                                code = code.replace(
                                    /\bimport\.meta\.url\b/g,
                                    `new URL('/@fs/${args.path}', window.location.origin)`
                                );
                                return { contents: code };
                            });
                        }
                    }]
            }
        }
    };
    return config;
});

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(`Will load Next.js config from: ${__dirname}`);

/**
 * @type {import('next').NextConfig}
 */
export default {
    typescript: {
        tsconfigPath: './tsconfig.json',
    },
    trailingSlash: true,
    reactStrictMode: true,
    output: 'standalone',
    serverExternalPackages: [
        '@codingame/monaco-vscode-typescript-language-features-default-extension',
    ],
    turbopack: {
        root: resolve(__dirname),
        rules: {
            // Target the specific broken dependency file
            // You can use a glob pattern to match the file inside node_modules
            './node_modules/@codingame/monaco-vscode-typescript-language-features-default-extension/index.js': {
                loaders: [
                    {
                        loader: resolve(__dirname, 'loaders/manipulate.cjs'),
                        options: {
                            target: 'browser',
                        },
                    },
                ],
                // "as": "*.js" tells Turbopack to treat the output as a JS module
                as: '*.js',
            },
        }
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
                    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' }
                ]
            }
        ];
    }
};

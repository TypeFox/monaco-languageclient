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
    distDir: 'dist',
    trailingSlash: true,
    reactStrictMode: true,
    output: 'standalone',
    // transpilePackages: ['@codingame/monaco-vscode-api'],
    turbopack: {
        root: resolve(__dirname),
        resolveAlias: {
            '/assets/workers/editor.worker.js': './bundle/langium-dsl/assets/workers/editor.worker.js',
            '/assets/workers/extensionHost.worker.js': './bundle/langium-dsl/assets/workers/extensionHost.worker.js',
            '/assets/workers/worker.js': './bundle/langium-dsl/assets/workers/worker.js',
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

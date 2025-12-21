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
    turbopack: {
        root: resolve(__dirname),
        resolveAlias: {
            // 'file:///_next/static/media/tsserver.web.556b7f5e.js': '.next/dev/static/media/tsserver.web.556b7f5e.js'
            // '/resources/*': './public/resources/*'
        }
    },
    // rules: {
    //     '*.js': {
    //         as: '*.js',
    //         // Conceptually, you want to replace variables,
    //         // but Turbo's API for granular replacement is evolving.
    //     }
    // },
    async headers() {
        // const isDev = process.env.NODE_ENV !== 'production';

        // // In dev, allow WebSockets (ws: wss:). In prod, keep it strict.
        // const connectSrc = isDev
        //     ? "connect-src * 'self' data: file: extension-file: blob: https: http: wss: ws:;"
        //     : "connect-src 'self' https: data: blob:;";

        // const cspHeader = `
        //     default-src 'self';
        //     script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: file:;
        //     worker-src 'self' data: file: extension-file: blob: 'unsafe-inline';
        //     style-src 'self' 'unsafe-inline';
        //     img-src 'self' data: https:;
        //     font-src 'self' data:;
        //     ${connectSrc}
        //     `.replace(/\n/g, '');

        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
                    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
                    // { key: 'Content-Security-Policy', value: cspHeader }
                ]
            }
        ];
    }
};

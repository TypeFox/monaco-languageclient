/**
 * @type {import('next').NextConfig}
 */
export default {
    typescript: {
        tsconfigPath: './tsconfig.json',
    },
    reactStrictMode: false,
    output: 'standalone',
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback.fs = false;
            config.resolve.fallback.module = false;
            config.resolve.fallback.vm = false;
        }

        return config;
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

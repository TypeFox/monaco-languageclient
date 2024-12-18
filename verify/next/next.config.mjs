/**
 * @type {import('next').NextConfig}
 */
export default {
    typescript: {
        tsconfigPath: './tsconfig.json',
    },
    output: 'standalone',
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback.fs = false;
            config.resolve.fallback.module = false;
            config.resolve.fallback.vm = false;
        }

        return config;
    },
};

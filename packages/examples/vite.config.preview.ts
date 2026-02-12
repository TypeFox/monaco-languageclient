import { defineConfig } from 'vite';
import { buildBaseProductionConfig } from './vite.production.base.js';

export default defineConfig(({ command }) => {
    console.log(`Running: ${command}`);
    const productionConfig = buildBaseProductionConfig();
    productionConfig.base = 'http://localhost:20002/';
    productionConfig.preview = {
        port: 20002,
        cors: {
            origin: '*'
        },
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp'
        }
    };
    return productionConfig;
});

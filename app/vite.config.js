/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default () => {
    return defineConfig({
        plugins: [
            react(),
            svgr({
                svgrOptions: {
                    // svgr options
                },
            }),
        ],
        server: {
            host: true,
            port: 3000,
            open: true,
        },
        test: {
            include: ['**/__tests__/**/*.test*'],
            globals: true,
        },
    });
};

import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
    resolve: {
        alias: {
            $lib: path.resolve(__dirname, 'src/lib'),
            '$env/dynamic/private': path.resolve(__dirname, 'tests/unit/__mocks__/env-dynamic-private.ts'),
            '$env/static/private': path.resolve(__dirname, 'tests/unit/__mocks__/env-static-private.ts'),
            '$app/environment': path.resolve(__dirname, 'tests/unit/__mocks__/app-environment.ts')
        }
    },
    test: {
        include: ['tests/unit/**/*.{test,spec}.{js,ts}', 'src/**/*.{test,spec}.{js,ts}'],
        environment: 'node',
        globals: true,
        setupFiles: ['tests/unit/setup.ts']
    }
});

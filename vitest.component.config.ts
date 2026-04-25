import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte()],
	resolve: {
		conditions: ['browser', 'import'],
		alias: {
			$lib: path.resolve(__dirname, 'src/lib'),
			'$env/dynamic/private': path.resolve(__dirname, 'tests/unit/__mocks__/env-dynamic-private.ts'),
			'$env/static/private': path.resolve(__dirname, 'tests/unit/__mocks__/env-static-private.ts'),
			'$app/environment': path.resolve(__dirname, 'tests/unit/__mocks__/app-environment.ts'),
			'$app/forms': path.resolve(__dirname, 'tests/components/__mocks__/app-forms.ts')
		}
	},
	test: {
		include: ['tests/components/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['tests/components/setup.ts']
	}
});

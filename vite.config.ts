import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/unit/**/*.{test,spec}.{js,ts}'],
		environment: 'node',
		globals: true
	},
	server: {
		port: Number(process.env.PORT ?? 5173),
		host: process.env.HOST ?? 'localhost'
	}
});

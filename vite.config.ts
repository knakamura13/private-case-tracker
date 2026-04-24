import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			strategies: 'generateSW',
			workbox: {
				runtimeCaching: [
					{
						urlPattern: /\/_app\/immutable\/.*/,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'sveltekit-immutable',
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24 * 30
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					}
				]
			},
			manifest: {
				name: 'Private Case Tracker',
				short_name: 'Case Tracker',
				description: 'Track case evidence, timelines, forms, and tasks.',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				theme_color: '#0f172a',
				background_color: '#0f172a',
				icons: [
					{
						src: '/pwa/icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/pwa/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/pwa/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			}
		})
	],
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

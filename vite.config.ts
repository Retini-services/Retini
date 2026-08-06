import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-svelte-components/vite';

export default defineConfig({
	plugins: [
		AutoImport({
			imports: [
				'svelte',
				{
					'@sveltejs/kit': ['goto', 'invalidate', 'invalidateAll', 'preloadData', 'preloadCode']
				}
			],
			dirs: ['./src/lib/utils', './src/lib/state'],
			dirsScanOptions: {
				filePatterns: ['*.js', '*.ts', '*.svelte.ts']
			},
			dts: './src/lib/types/auto-imports.d.ts'
		}),

		Components({
			dirs: ['./src/lib/components'],
			extensions: ['svelte', 'svx', 'md'],
			dts: './src/lib/types/components.d.ts'
		}),

		sveltekit({
			compilerOptions: {
				runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
			}
		})
	],

	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
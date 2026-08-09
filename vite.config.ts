import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
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
            dirs: ['src/lib/utils', 'src/lib/state'],
            dirsScanOptions: {
                filePatterns: ['*.js', '*.ts', '*.svelte.ts']
            },
            dts: './src/lib/types/auto-imports.d.ts'
        }),

        Components({
            dirs: ['src/lib/components', 'src/lib/components/ui'],
            extensions: ['svelte', 'svx', 'md'],
            directoryAsNamespace: false,
            dts: './src/lib/types/components.d.ts'
        }),

        tailwindcss(),

        sveltekit()
    ],

    css: {
        preprocessorOptions: {
            scss: {
                silenceDeprecations: ['import']
            }
        }
    },

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
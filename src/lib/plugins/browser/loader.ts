import type { BrowserPlugin } from './types';

export class BrowserPluginLoader {
    async load(
        plugin: BrowserPlugin
    ) {
        if (
            typeof window ===
            'undefined'
        ) {
            throw new Error(
                'Browser plugins can only run in the browser.'
            );
        }

        const entryUrl =
            new URL(
                plugin.manifest.entry,
                plugin.manifestUrl
            ).href;

        const module =
            await import(
                /* @vite-ignore */
                entryUrl
            );

        if (
            typeof module.default !==
            'function' &&
            typeof module.default !==
            'object'
        ) {
            throw new Error(
                `Plugin "${plugin.id}" has an invalid entry point.`
            );
        }

        return module.default;
    }
}

export const browserPluginLoader = new BrowserPluginLoader();
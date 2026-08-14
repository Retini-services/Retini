import type {
    BrowserPlugin,
    BrowserPluginModule
} from './types';

export class BrowserPluginLoader {
    async load(
        plugin: BrowserPlugin
    ): Promise<BrowserPluginModule> {
        if (typeof window === 'undefined') {
            throw new Error(
                'Browser plugins can only run in the browser.'
            );
        }

        const entryUrl = new URL(
            plugin.manifest.entry,
            plugin.manifestUrl
        ).href;

        const module = await import(
            /* @vite-ignore */
            entryUrl
        );

        const pluginInstance: unknown =
            module.default;

        if (
            typeof pluginInstance !== 'function' &&
            (
                typeof pluginInstance !== 'object' ||
                pluginInstance === null
            )
        ) {
            throw new Error(
                `Plugin "${plugin.id}" has an invalid entry point.`
            );
        }

        return pluginInstance as BrowserPluginModule;
    }
}

export const browserPluginLoader =
    new BrowserPluginLoader();
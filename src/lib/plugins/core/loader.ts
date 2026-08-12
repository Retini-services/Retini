import type { Plugin } from './types';
import { pluginRegistry } from './registry';

const pluginModules = import.meta.glob('../plugins/*/index.ts', {
    eager: true
}) as Record<string, { default: Plugin }>;

let loaded = false;

export function loadPlugins() {
    if (loaded) {
        return;
    }

    loaded = true;

    for (const [path, module] of Object.entries(pluginModules)) {
        const plugin = module.default;

        if (!plugin) {
            console.warn(`[Plugins] No default export found in ${path}`);
            continue;
        }

        pluginRegistry.register(plugin);
    }

    console.log(
        `[Plugins] Loaded ${pluginRegistry.getAll().length} plugin(s)`
    );
}
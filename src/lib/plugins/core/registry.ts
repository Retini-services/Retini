import type { Plugin } from './types';

class PluginRegistry {
    private plugins = new Map<string, Plugin>();

    register(plugin: Plugin) {
        if (this.plugins.has(plugin.id)) {
            console.warn(`[Plugins] Plugin "${plugin.id}" is already registered.`);
            return;
        }

        this.plugins.set(plugin.id, plugin);
    }

    unregister(id: string) {
        this.plugins.delete(id);
    }

    get(id: string) {
        return this.plugins.get(id);
    }

    getAll() {
        return [...this.plugins.values()];
    }

    getStartupPlugins() {
        return this.getAll().filter((plugin) =>
            plugin.targets.some((target) => target.type === 'startup')
        );
    }

    getLayoutPlugins() {
        return this.getAll().filter((plugin) =>
            plugin.targets.some((target) => target.type === 'layout')
        );
    }

    getRoutePlugins(pathname: string) {
        return this.getAll().filter((plugin) =>
            plugin.targets.some(
                (target) =>
                    target.type === 'route' &&
                    this.matchesRoute(target.path, pathname)
            )
        );
    }

    private matchesRoute(pattern: string, pathname: string) {
        if (pattern === pathname) {
            return true;
        }

        if (pattern.endsWith('/*')) {
            const prefix = pattern.slice(0, -2);

            return pathname === prefix || pathname.startsWith(`${prefix}/`);
        }

        return false;
    }
}

export const pluginRegistry = new PluginRegistry();
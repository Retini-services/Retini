import { pluginRegistry } from './registry';
import { loadPlugins } from './loader';
import type { Plugin, PluginInstance } from './types';

class PluginRuntime {
    private started = false;

    private startupInstances = new Map<string, PluginInstance>();
    private layoutInstances = new Map<string, PluginInstance>();
    private routeInstances = new Map<string, PluginInstance>();

    async start() {
        if (this.started) {
            return;
        }

        this.started = true;

        loadPlugins();

        await this.runStartupPlugins();
        await this.runLayoutPlugins();
    }

    private async setupPlugin(
        plugin: Plugin,
        route: string
    ): Promise<PluginInstance | undefined> {
        try {
            const result = await plugin.setup({
                route,
                browser: true,

                getPlugin: <T = Plugin>(id: string) => {
                    return pluginRegistry.get(id) as T | undefined;
                }
            });

            if (!result) {
                return undefined;
            }

            return result;
        } catch (error) {
            console.error(
                `[Plugins] Failed to execute "${plugin.id}"`,
                error
            );

            return undefined;
        }
    }

    private async runStartupPlugins() {
        const plugins = pluginRegistry.getStartupPlugins();

        for (const plugin of plugins) {
            const instance = await this.setupPlugin(plugin, '');

            if (instance) {
                this.startupInstances.set(plugin.id, instance);
            }
        }
    }

    private async runLayoutPlugins() {
        const plugins = pluginRegistry.getLayoutPlugins();

        for (const plugin of plugins) {
            const instance = await this.setupPlugin(plugin, '*');

            if (instance) {
                this.layoutInstances.set(plugin.id, instance);
            }
        }
    }

    async runRoute(pathname: string) {
        if (!this.started) {
            await this.start();
        }

        await this.destroyRoutePlugins();

        const plugins = pluginRegistry.getRoutePlugins(pathname);

        for (const plugin of plugins) {
            const instance = await this.setupPlugin(plugin, pathname);

            if (instance) {
                this.routeInstances.set(plugin.id, instance);
            }
        }
    }

    private async destroyInstances(
        instances: Map<string, PluginInstance>
    ) {
        for (const [id, instance] of instances) {
            try {
                await instance.destroy?.();
            } catch (error) {
                console.error(
                    `[Plugins] Failed to destroy "${id}"`,
                    error
                );
            }
        }

        instances.clear();
    }

    async destroyRoutePlugins() {
        await this.destroyInstances(this.routeInstances);
    }

    async destroy() {
        await this.destroyRoutePlugins();
        await this.destroyInstances(this.layoutInstances);
        await this.destroyInstances(this.startupInstances);

        this.started = false;
    }
}

export const pluginRuntime = new PluginRuntime();
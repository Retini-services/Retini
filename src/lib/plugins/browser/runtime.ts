import {
    browserPluginLoader
} from './loader';

import type {
    BrowserPlugin,
    BrowserPluginCallback,
    BrowserPluginContext,
    BrowserPluginModule,
    BrowserPluginRoute,
    BrowserPluginRouteCallback
} from './types';

class BrowserPluginRuntime {
    private plugins = new Map<
        string,
        BrowserPlugin
    >();

    private modules = new Map<
        string,
        BrowserPluginModule
    >();

    private routes: BrowserPluginRoute[] = [];

    private layoutCallbacks = new Map<
        string,
        BrowserPluginCallback[]
    >();

    private startCallbacks = new Map<
        string,
        BrowserPluginCallback[]
    >();

    private started = false;

    async start(
        plugins: BrowserPlugin[]
    ): Promise<void> {
        if (typeof window === 'undefined') {
            return;
        }

        this.plugins.clear();
        this.modules.clear();
        this.routes = [];
        this.layoutCallbacks.clear();
        this.startCallbacks.clear();

        for (const plugin of plugins) {
            if (!plugin.enabled) {
                continue;
            }

            this.plugins.set(
                plugin.id,
                plugin
            );

            try {
                const module =
                    await browserPluginLoader.load(
                        plugin
                    );

                this.modules.set(
                    plugin.id,
                    module
                );

                const context =
                    this.createContext(
                        plugin,
                        window.location.pathname
                    );

                if (typeof module === 'function') {
                    await module(context);
                } else if (
                    typeof module.install === 'function'
                ) {
                    await module.install(context);
                }
            } catch (error) {
                console.error(
                    `[BrowserPlugins] Failed to start "${plugin.id}":`,
                    error
                );
            }
        }

        this.started = true;

        await this.runStart();
    }

    async runStart(): Promise<void> {
        for (const [
            pluginId,
            callbacks
        ] of this.startCallbacks) {
            const plugin =
                this.plugins.get(pluginId);

            if (!plugin) {
                continue;
            }

            const context =
                this.createContext(
                    plugin,
                    window.location.pathname
                );

            for (const callback of callbacks) {
                try {
                    await callback(context);
                } catch (error) {
                    console.error(
                        `[BrowserPlugins] Start callback failed in "${plugin.id}":`,
                        error
                    );
                }
            }
        }
    }

    async runLayout(): Promise<void> {
        if (!this.started) {
            return;
        }

        for (const [
            pluginId,
            callbacks
        ] of this.layoutCallbacks) {
            const plugin =
                this.plugins.get(pluginId);

            if (!plugin) {
                continue;
            }

            const context =
                this.createContext(
                    plugin,
                    window.location.pathname
                );

            for (const callback of callbacks) {
                try {
                    await callback(context);
                } catch (error) {
                    console.error(
                        `[BrowserPlugins] Layout callback failed in "${plugin.id}":`,
                        error
                    );
                }
            }
        }
    }

    async runRoute(
        pathname: string
    ): Promise<void> {
        if (!this.started) {
            return;
        }

        for (const route of this.routes) {
            if (
                !this.matchesRoute(
                    pathname,
                    route.route
                )
            ) {
                continue;
            }

            const plugin =
                this.plugins.get(
                    route.pluginId
                );

            if (!plugin) {
                continue;
            }

            const context =
                this.createContext(
                    plugin,
                    pathname
                );

            try {
                await route.callback(
                    context
                );
            } catch (error) {
                console.error(
                    `[BrowserPlugins] Route callback failed in "${plugin.id}":`,
                    error
                );
            }
        }
    }

    private createContext(
        plugin: BrowserPlugin,
        route: string
    ): BrowserPluginContext {
        return {
            id: plugin.id,
            name: plugin.name,
            version: plugin.version,
            manifestUrl: plugin.manifestUrl,
            route,

            registerRoute: (
                routePath: string,
                callback: BrowserPluginRouteCallback
            ): void => {
                this.routes.push({
                    pluginId: plugin.id,
                    route: routePath,
                    callback
                });
            },

            onLayout: (
                callback: BrowserPluginCallback
            ): void => {
                const callbacks =
                    this.layoutCallbacks.get(
                        plugin.id
                    ) ?? [];

                callbacks.push(
                    callback
                );

                this.layoutCallbacks.set(
                    plugin.id,
                    callbacks
                );
            },

            onStart: (
                callback: BrowserPluginCallback
            ): void => {
                const callbacks =
                    this.startCallbacks.get(
                        plugin.id
                    ) ?? [];

                callbacks.push(
                    callback
                );

                this.startCallbacks.set(
                    plugin.id,
                    callbacks
                );
            }
        };
    }

    private matchesRoute(
        pathname: string,
        route: string
    ): boolean {
        if (route === '*') {
            return true;
        }

        if (route === pathname) {
            return true;
        }

        if (route.endsWith('/*')) {
            const prefix =
                route.slice(0, -2);

            return (
                pathname === prefix ||
                pathname.startsWith(
                    `${prefix}/`
                )
            );
        }

        return false;
    }

    getLoadedPluginIds(): string[] {
        return [
            ...this.plugins.keys()
        ];
    }

    isStarted(): boolean {
        return this.started;
    }

    stop(): void {
        this.plugins.clear();
        this.modules.clear();
        this.routes = [];
        this.layoutCallbacks.clear();
        this.startCallbacks.clear();
        this.started = false;
    }
}

export const browserPluginRuntime =
    new BrowserPluginRuntime();
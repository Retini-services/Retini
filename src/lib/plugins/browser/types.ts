import type { BrowserPluginManifest } from '$lib/schemas';

export interface BrowserPlugin {
    id: string;
    name: string;
    version: string;
    manifestUrl: string;
    manifest: BrowserPluginManifest;
    enabled: boolean;
    installedAt: number;
}

export interface BrowserPluginExport {
    formatVersion: number;
    plugins: Array<{
        id: string;
        manifestUrl: string;
        enabled: boolean;
    }>;
}

export interface BrowserPluginContext {
    id: string;
    name: string;
    version: string;
    manifestUrl: string;
    route: string;

    registerRoute(
        route: string,
        callback: BrowserPluginRouteCallback
    ): void;

    onLayout(
        callback: BrowserPluginCallback
    ): void;

    onStart(
        callback: BrowserPluginCallback
    ): void;
}

export type BrowserPluginCallback = (
    context: BrowserPluginContext
) => void | Promise<void>;

export type BrowserPluginRouteCallback = (
    context: BrowserPluginContext
) => void | Promise<void>;

export interface BrowserPluginDefinition {
    install(
        context: BrowserPluginContext
    ): void | Promise<void>;
}

export type BrowserPluginModule =
    | BrowserPluginDefinition
    | BrowserPluginCallback;

export interface BrowserPluginRoute {
    pluginId: string;
    route: string;
    callback: BrowserPluginRouteCallback;
}
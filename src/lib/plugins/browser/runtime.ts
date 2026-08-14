export interface BrowserPluginContext {
    id: string;

    name: string;

    version: string;

    manifestUrl: string;

    route: string;

    registerRoute(
        route: string,
        callback: (
            context: BrowserPluginContext
        ) => void | Promise<void>
    ): void;

    onLayout(
        callback: (
            context: BrowserPluginContext
        ) => void | Promise<void>
    ): void;

    onStart(
        callback: (
            context: BrowserPluginContext
        ) => void | Promise<void>
    ): void;
}

export interface BrowserPluginModule {
    default:
    | BrowserPluginDefinition
    | ((
        context: BrowserPluginContext
    ) => void | Promise<void>);
}

export interface BrowserPluginDefinition {
    install(
        context: BrowserPluginContext
    ): void | Promise<void>;
}
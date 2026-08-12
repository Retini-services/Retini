export type PluginTarget =
    | {
        type: 'startup';
    }
    | {
        type: 'layout';
    }
    | {
        type: 'route';
        path: string;
    };

export interface PluginContext {
    route: string;
    browser: boolean;
    getPlugin<T = Plugin>(id: string): T | undefined;
}

export interface PluginInstance {
    destroy?: () => void | Promise<void>;
}

export interface Plugin {
    id: string;
    name: string;
    version: string;

    targets: PluginTarget[];

    setup: (context: PluginContext) =>
        | void
        | PluginInstance
        | Promise<void | PluginInstance>;
}
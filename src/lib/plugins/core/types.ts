import type { Component } from 'svelte';

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

export interface PluginComponent {

    name: string;

    component: Component;


    path?: string;
}

export interface PluginUI {

    mount(
        component: Component,
        options?: {
            target?: HTMLElement | string;
            props?: Record<string, unknown>;
        }
    ): {
        destroy: () => void;
    };


    mountComponent(
        name: string,
        options?: {
            target?: HTMLElement | string;
            props?: Record<string, unknown>;
        }
    ): {
        destroy: () => void;
    } | undefined;
}

export interface PluginContext {
    route: string;
    browser: boolean;

    getPlugin<T = Plugin>(id: string): T | undefined;

    ui: PluginUI;
}

export interface PluginInstance {
    destroy?: () => void | Promise<void>;
}

export interface Plugin {
    id: string;
    name: string;
    version: string;

    targets: PluginTarget[];


    components?: PluginComponent[];

    setup: (
        context: PluginContext
    ) => void | PluginInstance | Promise<void | PluginInstance>;
}
import { mount, unmount } from 'svelte';
import type { PluginComponent, PluginUI } from './types';

function resolveTarget(target: HTMLElement | string): HTMLElement {
    if (typeof target !== 'string') {
        return target;
    }

    const element = document.querySelector<HTMLElement>(target);

    if (!element) {
        throw new Error(
            `[Plugins] UI target "${target}" was not found.`
        );
    }

    return element;
}

export function createPluginUI(
    components: PluginComponent[] = []
): PluginUI {
    const componentMap = new Map(
        components.map((component) => [
            component.name,
            component.component
        ])
    );

    return {
        mount(component, options = {}) {
            const target = resolveTarget(
                options.target ?? document.body
            );

            const instance = mount(component, {
                target,
                props: options.props ?? {}
            });

            let destroyed = false;

            return {
                destroy() {
                    if (destroyed) {
                        return;
                    }

                    destroyed = true;

                    unmount(instance);
                }
            };
        },

        mountComponent(name, options = {}) {
            const component = componentMap.get(name);

            if (!component) {
                console.warn(
                    `[Plugins] Component "${name}" was not found.`
                );

                return undefined;
            }

            return this.mount(component, options);
        }
    };
}
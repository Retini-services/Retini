<script lang="ts">
    import { browserPluginManager } from '$lib/plugins';
    import type { BrowserPlugin } from '$lib/plugins';

    let { plugin, onChanged } = $props<{
        plugin: BrowserPlugin;
        onChanged?: () => void;
    }>();

    const pluginName = $derived(plugin.manifest.name || plugin.name);

    const pluginVersion = $derived(plugin.manifest.version || plugin.version);

    const pluginDesc = $derived(plugin.manifest.description || 'No description provided.');

    const pluginIcon = $derived(plugin.manifest.icon);

    async function togglePlugin() {
        browserPluginManager.setEnabled(plugin.id, !plugin.enabled);

        onChanged?.();
    }

    async function refreshPlugin() {
        try {
            await browserPluginManager.refresh(plugin.id);

            onChanged?.();
        } catch (error) {
            console.error('[BrowserPlugins] Failed to refresh plugin:', error);
        }
    }

    function removePlugin() {
        browserPluginManager.remove(plugin.id);

        onChanged?.();
    }
</script>

<div
    class="flex items-start justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm gap-4"
>
    <div class="flex items-start gap-3 min-w-0">
        {#if pluginIcon}
            <img
                src={pluginIcon}
                alt={pluginName}
                class="w-10 h-10 rounded-lg object-contain bg-gray-100 dark:bg-gray-900 p-1 shrink-0"
            />
        {:else}
            <div
                class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0"
            >
                {pluginName.charAt(0).toUpperCase()}
            </div>
        {/if}

        <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-2">
                <h3 class="font-semibold text-gray-900 dark:text-white text-base truncate">
                    {pluginName}
                </h3>

                <span
                    class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono shrink-0"
                >
                    v{pluginVersion}
                </span>
            </div>

            <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {pluginDesc}
            </p>
        </div>
    </div>

    <div class="flex items-center gap-2 shrink-0">
        <button
            type="button"
            class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors
            {plugin.enabled
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'}"
            onclick={togglePlugin}
        >
            {plugin.enabled ? 'Disable' : 'Enable'}
        </button>

        <button
            type="button"
            class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            onclick={refreshPlugin}
        >
            Refresh
        </button>

        <button
            type="button"
            class="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900 transition-colors"
            onclick={removePlugin}
        >
            Remove
        </button>
    </div>
</div>

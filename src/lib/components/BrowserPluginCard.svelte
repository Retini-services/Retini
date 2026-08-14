<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import type { BrowserPlugin } from '$lib/plugins';

    interface Props {
        plugin: BrowserPlugin;
        onToggle?: () => void;
        onRemove?: () => void;
        onRefresh?: () => void;
    }

    let { plugin, onToggle, onRemove, onRefresh }: Props = $props();
</script>

<div class="browser-plugin-card">
    <div class="plugin-info">
        <div class="plugin-icon">
            {#if plugin.manifest.icon}
                <img src={new URL(plugin.manifest.icon, plugin.manifestUrl).href} alt="" />
            {:else}
                No icon found.
            {/if}
        </div>

        <div>
            <h3>{plugin.name}</h3>

            <p>
                v{plugin.version}
                {#if plugin.manifest.author}
                    · {plugin.manifest.author}
                {/if}
            </p>

            {#if plugin.manifest.description}
                <span>
                    {plugin.manifest.description}
                </span>
            {/if}
        </div>
    </div>

    <div class="plugin-actions">
        <Button variant="outline" onclick={onToggle}>
            {plugin.enabled ? 'Disable' : 'Enable'}
        </Button>

        <Button variant="outline" onclick={onRefresh}>Refresh</Button>

        <Button variant="destructive" onclick={onRemove}>Remove</Button>
    </div>
</div>

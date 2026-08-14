<script lang="ts">
    import '$lib/styles/layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import { onMount } from 'svelte';
    import { afterNavigate } from '$app/navigation';

    import { browserPluginManager, browserPluginRuntime } from '$lib/plugins';

    let { children } = $props();

    onMount(async () => {
        console.log('[BrowserPlugins] Initializing...');

        const plugins = browserPluginManager.load();

        await browserPluginRuntime.start(plugins);

        await browserPluginRuntime.runLayout();

        await browserPluginRuntime.runRoute(window.location.pathname);
    });

    afterNavigate(async ({ to }) => {
        const pathname = to?.url.pathname ?? window.location.pathname;

        await browserPluginRuntime.runRoute(pathname);
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

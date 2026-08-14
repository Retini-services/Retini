<script lang="ts">
    import '../styles/layout.css';

    import favicon from '$lib/assets/favicon.svg';

    import { onMount } from 'svelte';

    import { afterNavigate } from '$app/navigation';

    import { pluginRuntime, browserPluginManager, browserPluginRuntime } from '$lib/plugins';

    let { children } = $props();

    onMount(async () => {
        await pluginRuntime.start();

        const browserPlugins = browserPluginManager.load();

        await browserPluginRuntime.start(browserPlugins);

        await browserPluginRuntime.runLayout();

        await browserPluginRuntime.runRoute(window.location.pathname);
    });

    afterNavigate(async ({ to }) => {
        const pathname = to?.url.pathname ?? window.location.pathname;

        await pluginRuntime.runRoute(pathname);

        await browserPluginRuntime.runRoute(pathname);

        await browserPluginRuntime.runLayout();
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

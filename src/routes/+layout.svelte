<script lang="ts">
    import '../styles/layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import { pluginRuntime } from '$lib/plugins';
    import { onMount } from 'svelte';
    import { afterNavigate } from '$app/navigation';

    onMount(async () => {
        await pluginRuntime.start();
    });

    afterNavigate(async ({ to }) => {
        const pathname = to?.url.pathname ?? window.location.pathname;

        await pluginRuntime.runRoute(pathname);
    });

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

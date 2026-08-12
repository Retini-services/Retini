<script lang="ts">
    import { onMount } from 'svelte';
    import { PUBLIC_PROXY_URL } from '$env/static/public';
    import { initProxy, type ProxyTransport } from '$lib/proxy/proxy';

    let url = $state('');
    let engine = $state('scramjet');
    let transport = $state<ProxyTransport>('epoxy');

    let frameElement = $state<HTMLIFrameElement>();
    let frame: any = $state(null);

    let loading = $state(false);
    let error = $state('');

    async function initializeProxy() {
        if (!frameElement) return;

        loading = true;
        error = '';

        try {
            const controller = await initProxy(transport);

            frame = controller.createFrame(frameElement);
        } catch (err) {
            console.error(err);

            error = err instanceof Error ? err.message : 'Failed to initialize proxy.';
        } finally {
            loading = false;
        }
    }

    async function navigate() {
        const input = url.trim();

        if (!input || !frame) return;

        let target = input;

        if (!/^https?:\/\//i.test(target)) {
            target = `https://${target}`;
        }

        try {
            loading = true;
            error = '';

            frame.go(target);
        } catch (err) {
            console.error(err);

            error = err instanceof Error ? err.message : 'Failed to navigate.';
        } finally {
            loading = false;
        }
    }

    async function changeTransport() {
        if (!frameElement) return;

        frame = null;

        await initializeProxy();
        await navigate();
    }

    onMount(() => {
        initializeProxy();
    });
</script>

<svelte:head>
    <title>Retini Proxy</title>
    <meta name="description" content="Browse the web through Retini Proxy." />
</svelte:head>

<div class="proxy-page">
    <header class="toolbar">
        <form
            class="address-bar"
            onsubmit={(event) => {
                event.preventDefault();
                navigate();
            }}
        >
            <input
                bind:value={url}
                type="text"
                placeholder="Search or enter a URL"
                autocomplete="off"
                spellcheck="false"
            />

            <button type="submit"> Go </button>
        </form>

        <div class="options">
            <label>
                <span>Engine</span>

                <select bind:value={engine}>
                    <option value="scramjet"> Scramjet </option>

                    <option value="ultraviolet" disabled> Ultraviolet </option>
                </select>
            </label>

            <label>
                <span>Transport</span>

                <select bind:value={transport} onchange={changeTransport}>
                    <option value="epoxy"> Epoxy </option>

                    <option value="libcurl"> Libcurl </option>
                </select>
            </label>
        </div>
    </header>

    {#if error}
        <div class="error">
            <strong>Proxy error</strong>
            <p>{error}</p>
        </div>
    {/if}

    <div class="frame-wrapper">
        {#if loading}
            <div class="loading">Initializing proxy...</div>
        {/if}

        <iframe
            bind:this={frameElement}
            title="Retini Proxy"
            class="proxy-frame"
            allow="fullscreen; autoplay; clipboard-read; clipboard-write"
        ></iframe>
    </div>
</div>

<style>
    :global(html),
    :global(body) {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
    }

    :global(body) {
        overflow: hidden;
    }

    .proxy-page {
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .toolbar {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .address-bar {
        display: flex;
        gap: 8px;
        width: 100%;
    }

    .address-bar input {
        flex: 1;
        min-width: 0;
        padding: 10px 12px;
        border: 1px solid #ccc;
        border-radius: 8px;
        font-size: 15px;
        outline: none;
    }

    .address-bar input:focus {
        border-color: #888;
    }

    .address-bar button {
        padding: 10px 18px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 15px;
    }

    .options {
        display: flex;
        gap: 16px;
    }

    label {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    label span {
        font-size: 14px;
    }

    select {
        padding: 7px 10px;
        border: 1px solid #ccc;
        border-radius: 7px;
    }

    .proxy-frame {
        flex: 1;
        width: 100%;
        min-height: 0;
        border: none;
    }
</style>

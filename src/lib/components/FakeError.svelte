<script lang="ts">
    import * as Dialog from '$lib/components/ui/dialog';
    import { Input } from '$lib/components/ui/input';
    import { Button } from '$lib/components/ui/button';
    import { onMount } from 'svelte';

    interface Props {
        onLoadJson?: (url: string) => void;
    }

    let { onLoadJson }: Props = $props();

    let isDialogOpen = $state(false);
    let jsonUrlInput = $state('');

    onMount(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.code === 'KeyG') {
                e.preventDefault();
                isDialogOpen = true;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    function handleSubmit() {
        if (!jsonUrlInput.trim()) return;
        onLoadJson?.(jsonUrlInput.trim());
        isDialogOpen = false;
    }
</script>

<main class="error-container">
    <div class="error-card">
        <h1 class="error-code">500</h1>
        <h2>you've reached an error.</h2>
        <p class="error-message">Property 'map' does not exist on type 'string'.</p>
    </div>
</main>

<Dialog.Root bind:open={isDialogOpen}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Enter JSON URL</Dialog.Title>
            <Dialog.Description>
                Provide the endpoint URL to load your configuration and bypass the error state.
            </Dialog.Description>
        </Dialog.Header>

        <div class="dialog-body space-y-2 py-2">
            <label for="json-url-input" class="text-xs font-semibold text-slate-300">JSON URL</label
            >
            <Input
                id="json-url-input"
                type="text"
                bind:value={jsonUrlInput}
                placeholder="https://example.com/data.json"
            />
        </div>

        <Dialog.Footer>
            <Button variant="ghost" onclick={() => (isDialogOpen = false)}>Cancel</Button>
            <Button variant="default" onclick={handleSubmit}>Load</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<style lang="scss">
    .error-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: #0f172a;
        color: #f8fafc;
        font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            sans-serif;
        padding: 16px;
    }

    .error-card {
        background: #1e293b;
        border: 1px solid #334155;
        padding: 32px;
        border-radius: 12px;
        text-align: center;
        max-width: 400px;
        width: 100%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);

        .error-code {
            font-size: 4rem;
            font-weight: 800;
            color: #38bdf8;
            margin: 0 0 8px 0;
            line-height: 1;
        }

        h2 {
            font-size: 1.25rem;
            font-weight: 700;
            margin: 0 0 12px 0;
            color: #f8fafc;
        }

        .error-message {
            font-size: 0.8rem;
            color: #f87171;
            font-family: monospace;
            background: #0f172a;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #7f1d1d;
            margin: 0;
            text-align: left;
        }
    }
</style>

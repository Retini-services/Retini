<script lang="ts">
    import '../styles/main.scss';

    interface Props {
        onAdd: (url: string) => Promise<boolean>;
        onClose: () => void;
    }

    let { onAdd, onClose }: Props = $props();
    let newUrl = $state('');
    let errorMessage = $state('');

    async function handleSubmit() {
        if (!newUrl.trim()) return;
        errorMessage = '';

        const success = await onAdd(newUrl);
        if (success) {
            onClose();
        } else {
            errorMessage = 'Invalid JSON URL or failed to load games.';
        }
    }
</script>

<div class="modal-backdrop">
    <div class="test-card modal-card">
        <h3>Add More Games</h3>
        <p class="subtitle">Insert JSON URL</p>

        <div class="field">
            <input
                type="text"
                bind:value={newUrl}
                placeholder="Enter JSON URL..."
                onkeydown={(e) => e.key === 'Enter' && handleSubmit()}
            />
        </div>

        {#if errorMessage}
            <p class="error-msg">{errorMessage}</p>
        {/if}

        <div class="modal-actions">
            <button class="cancel-btn" onclick={onClose}>Cancel</button>
            <button class="submit-btn" onclick={handleSubmit}>Add Games</button>
        </div>
    </div>
</div>

<style lang="scss">
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999;
    }

    .modal-card {
        h3 {
            margin: 0 0 4px 0;
            color: var(--text-color);
        }
        .subtitle {
            font-size: 0.85rem;
            color: var(--muted-color);
            margin: 0 0 16px 0;
        }
    }

    .error-msg {
        color: #ef4444;
        font-size: 0.8rem;
        margin: 8px 0 0 0;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;

        button {
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            border: none;
        }

        .cancel-btn {
            background-color: var(--border-color);
            color: var(--text-color);
        }

        .submit-btn {
            background-color: #2563eb;
            color: #ffffff;
        }
    }
</style>

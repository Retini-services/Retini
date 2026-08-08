<script lang="ts">
    import { devTools } from "$lib/state/DevTools.svelte";
    import FileTreeNode from "./FileTreeNode.svelte";
    import { onMount } from "svelte";

    let isMounted = $state(false);

    onMount(() => {
        isMounted = true;
    });
</script>

<!-- Only render once mounted in the browser and dev mode is verified -->
{#if isMounted && devTools.isDevMode}
    <div class="devtools-wrapper">
        <button class="devtools-trigger" onclick={devTools.togglePanel}>
            devTools
        </button>

        {#if devTools.isOpen}
            <div class="devtools-panel">
                <div class="panel-header">
                    <div class="header-title">
                        <span class="icon">🛠️</span>
                        <h3>DevTools</h3>
                    </div>
                    <button class="close-btn" onclick={devTools.togglePanel}>✕</button>
                </div>

                <div class="panel-tabs">
                    <button 
                        class={devTools.activeTab === "general" ? "active" : ""} 
                        onclick={() => (devTools.activeTab = "general")}
                    >
                        General
                    </button>
                    <button 
                        class={devTools.activeTab === "storage" ? "active" : ""} 
                        onclick={() => { devTools.activeTab = "storage"; devTools.refreshStorage(); }}
                    >
                        Storage ({devTools.localStorageItems.length})
                    </button>
                    <button 
                        class={devTools.activeTab === "static" ? "active" : ""} 
                        onclick={() => (devTools.activeTab = "static")}
                    >
                        Explorer
                    </button>
                    <button 
                        class={devTools.activeTab === "inject" ? "active" : ""} 
                        onclick={() => (devTools.activeTab = "inject")}
                    >
                        Inject
                    </button>
                </div>

                {#if devTools.activeTab === "general"}
                    <div class="tab-content">
                        <div class="setting-row">
                            <div>
                                <strong>Dev Mode State</strong>
                                <p class="desc">
                                    {#if devTools.isEnvDev}
                                        Locked via <code>PUBLIC_DEV_MODE=true</code>
                                    {:else}
                                        Toggle local dev mode override.
                                    {/if}
                                </p>
                            </div>
                            <button class="toggle-btn {devTools.isDevMode ? 'on' : 'off'}" onclick={devTools.toggleDevMode}>
                                {devTools.isDevMode ? "ENABLED" : "DISABLED"}
                            </button>
                        </div>

                        <div class="setting-block">
                            <label for="duration-input">Remembrance Duration</label>
                            <div class="inline-input">
                                <input 
                                    id="duration-input" 
                                    type="text" 
                                    bind:value={devTools.customDuration} 
                                    placeholder="e.g. 180 days" 
                                />
                                <button class="action-btn" onclick={devTools.applyCustomRemembrance}>Set</button>
                            </div>
                            <div class="btn-group">
                                <button class="action-btn unlimited" onclick={devTools.toggleUnlimitedRemembrance}>
                                    {devTools.customDuration === "Forever" ? "⏳ Standard Duration" : "♾️ Set Unlimited"}
                                </button>
                                <button class="danger-btn" onclick={devTools.removeRemembrance}>
                                    🗑️ Clear
                                </button>
                            </div>
                        </div>
                    </div>

                {:else if devTools.activeTab === "storage"}
                    <div class="tab-content">
                        <div class="flex-between">
                            <strong>LocalStorage Items</strong>
                            <button class="danger-btn" onclick={devTools.clearAllStorage}>Clear Storage</button>
                        </div>
                        <div class="storage-list">
                            {#each devTools.localStorageItems as item}
                                <div class="storage-item">
                                    <div class="storage-inputs">
                                        <span class="key-label">{item.key}</span>
                                        <input 
                                            type="text" 
                                            bind:value={item.value} 
                                            onchange={() => devTools.updateStorageItem(item.key, item.value)}
                                            class="val-input"
                                        />
                                    </div>
                                    <button class="del-btn" onclick={() => devTools.removeStorageItem(item.key)}>✕</button>
                                </div>
                            {/each}
                        </div>
                    </div>

                {:else if devTools.activeTab === "static"}
                    <div class="tab-content">
                        <p class="desc">Click folders to expand or files to inspect in iframe:</p>
                        <div class="explorer-tree">
                            {#each devTools.fileTree as node}
                                <FileTreeNode {node} />
                            {/each}
                        </div>
                    </div>

                {:else if devTools.activeTab === "inject"}
                    <div class="tab-content">
                        <label for="script-textarea">Execute Inline JavaScript</label>
                        <textarea id="script-textarea" bind:value={devTools.scriptInput} placeholder="console.log(window.location.href);"></textarea>
                        <button class="action-btn full" onclick={devTools.runScript}>▶ Run Script</button>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
{/if}

{#if isMounted && devTools.isPreviewOpen}
    <div 
        class="draggable-iframe-window"
        style="left: {devTools.windowPos.x}px; top: {devTools.windowPos.y}px;"
    >
        <div 
            class="drag-header" 
            role="toolbar" 
            tabindex="0" 
            onmousedown={devTools.startDrag}
        >
            <div class="window-title">
                <span class="drag-handle">⠿</span>
                <span>Preview: <code>{devTools.previewUrl}</code></span>
            </div>
            <div class="window-actions">
                <button class="control-btn" onclick={() => window.open(devTools.previewUrl, '_blank')}>↗</button>
                <button class="control-btn close" onclick={devTools.closePreview}>✕</button>
            </div>
        </div>
        <div class="iframe-container" class:pointer-disabled={devTools.isDragging}>
            <iframe src={devTools.previewUrl} title="DevTools Preview Container"></iframe>
        </div>
    </div>
{/if}

<style lang="scss">
    .devtools-wrapper {
        position: fixed;
        bottom: 16px;
        left: 16px;
        z-index: 99999;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .devtools-trigger {
        background: #0f172a;
        color: #38bdf8;
        border: 1px solid #334155;
        padding: 8px 14px;
        font-size: 0.8rem;
        font-weight: 700;
        border-radius: 20px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        transition: all 0.2s ease;
        &:hover { background: #1e293b; transform: translateY(-2px); }
    }

    .devtools-panel {
        position: absolute;
        bottom: 45px;
        left: 0;
        width: 360px;
        background: #0f172a;
        color: #f8fafc;
        border: 1px solid #334155;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background: #1e293b;
        border-bottom: 1px solid #334155;
        .header-title { display: flex; align-items: center; gap: 6px; h3 { margin: 0; font-size: 0.9rem; font-weight: 700; color: #f8fafc; } }
        .close-btn { background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 0.9rem; &:hover { color: #ffffff; } }
    }

    .panel-tabs {
        display: flex;
        background: #0f172a;
        border-bottom: 1px solid #1e293b;

        button {
            flex: 1;
            background: transparent;
            border: none;
            padding: 8px 0;
            font-size: 0.75rem;
            font-weight: 600;
            color: #94a3b8;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.15s ease;

            &.active {
                color: #38bdf8 !important;
                border-bottom-color: #38bdf8 !important;
                background: rgba(56, 189, 248, 0.1) !important;
            }

            &:hover { color: #e2e8f0; }
        }
    }

    .tab-content { padding: 14px; display: flex; flex-direction: column; gap: 12px; max-height: 320px; overflow-y: auto; font-size: 0.8rem; }
    .desc { margin: 0; color: #94a3b8; font-size: 0.75rem; code { color: #38bdf8; } }
    .setting-row { display: flex; justify-content: space-between; align-items: center; }
    .toggle-btn { border: none; padding: 4px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: 700; cursor: pointer; &.on { background: #22c55e; color: #000; } &.off { background: #334155; color: #94a3b8; } }
    .setting-block { display: flex; flex-direction: column; gap: 6px; }
    .inline-input { display: flex; gap: 6px; input { flex: 1; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 0.75rem; } }
    .btn-group { display: flex; gap: 6px; margin-top: 4px; }
    
    .action-btn { 
        background: #0284c7; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.75rem;
        &.unlimited { flex: 1; background: #16a34a; &:hover { background: #15803d; } }
        &.full { width: 100%; margin-top: 6px; } 
        &:hover { background: #0369a1; } 
    }
    
    .danger-btn { background: #dc2626; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; font-size: 0.7rem; cursor: pointer; &:hover { background: #b91c1c; } }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    
    .storage-list { display: flex; flex-direction: column; gap: 6px; }
    .storage-item { display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 6px 8px; border-radius: 6px; }
    
    .storage-inputs {
        display: flex; flex-direction: column; gap: 4px; flex: 1; margin-right: 8px;
        .key-label { font-weight: 700; color: #38bdf8; font-size: 0.75rem; }
        .val-input { background: #0f172a; border: 1px solid #334155; color: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-family: monospace; &:focus { outline: none; border-color: #38bdf8; } }
    }

    .del-btn { background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 0.75rem; }
    textarea { width: 100%; height: 80px; background: #1e293b; border: 1px solid #334155; color: #38bdf8; font-family: monospace; padding: 8px; border-radius: 6px; resize: none; font-size: 0.75rem; }

    .draggable-iframe-window {
        position: fixed;
        width: 500px;
        height: 400px;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 8px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
        z-index: 100000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        resize: both;
    }

    .drag-header {
        background: #1e293b;
        padding: 8px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
        user-select: none;
        border-bottom: 1px solid #334155;
        .window-title { display: flex; align-items: center; gap: 8px; color: #f8fafc; font-size: 0.8rem; }
        .drag-handle { color: #38bdf8; font-weight: bold; font-size: 1.1rem; }
    }

    .window-actions { display: flex; gap: 6px; }

    .control-btn {
        background: #334155; border: none; color: #94a3b8; border-radius: 4px; width: 20px; height: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.7rem;
        &:hover { color: #fff; background: #475569; }
        &.close:hover { background: #ef4444; color: #fff; }
    }

    .iframe-container {
        flex: 1; width: 100%; height: 100%; background: #ffffff;
        &.pointer-disabled { pointer-events: none; }
        iframe { width: 100%; height: 100%; border: none; }
    }
</style>
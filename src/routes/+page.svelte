<script lang="ts">
    import '../styles/global.scss';
    import '../styles/main.scss';
    import { onMount } from 'svelte';
    import { Toaster } from 'svelte-sonner';
    import {
        GameViewer,
        AddGamesModal,
        FakeError,
        Navbar,
        GameCard,
        SettingsView,
        DevTools,
    } from '$lib/components';

    const state = new DashboardState();

    onMount(() => {
        state.init();
        autoTabCloak();

        const handleKeyDown = (e: KeyboardEvent) => {
            const savedPanicKey = localStorage.getItem('panic_key') || '\\';
            if (e.key === savedPanicKey) {
                state.triggerPanic();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });
</script>

<Toaster position="top-right" richColors />

{#if state.selectedGame}
    <GameViewer
        url={state.selectedGame.url}
        title={state.selectedGame.title}
        onClose={() => (state.selectedGame = null)}
    />
{/if}

{#if state.isAddModalOpen}
    <AddGamesModal
        onAdd={(url) => state.appendMoreGames(url)}
        onClose={() => (state.isAddModalOpen = false)}
    />
{/if}

{#if !state.isValid}
    <FakeError
        onLoadJson={(url) => {
            state.customUrl = url;
            state.testCustom();
        }}
    />
{:else}
    <div class="dashboard-layout">
        <Navbar
            activeTab={state.activeTab}
            onTabChange={(tab) => (state.activeTab = tab)}
            onOpenAddModal={() => (state.isAddModalOpen = true)}
            onRefreshRemembrance={() => state.refreshRemembrance()}
        />

        {#if state.activeTab === 'Overview'}
            <main class="dashboard-content">
                <div class="header-section">
                    <div class="header-title">
                        <h2>My Games Dashboard</h2>
                        <p class="subtitle">Loaded from: {state.loadedUrls.join(', ')}</p>
                    </div>

                    <div class="search-box">
                        <input
                            type="text"
                            bind:value={state.searchQuery}
                            placeholder="Search by tag or title..."
                        />
                    </div>
                </div>

                {#if state.filteredGames.length === 0}
                    <p class="no-results">No games found matching "{state.searchQuery}"</p>
                {:else}
                    <div class="games-grid">
                        {#each state.filteredGames as game}
                            <GameCard
                                {game}
                                onSelect={(g) => (state.selectedGame = g)}
                                onDelete={(g) => state.deleteGame(g)}
                            />
                        {/each}
                    </div>
                {/if}
            </main>
        {:else if state.activeTab === 'Settings'}
            <SettingsView
                currentUrl={state.customUrl}
                deletedGamesList={state.deletedGamesList}
                onRestoreGame={(key) => state.restoreSingleGame(key)}
                onRestoreAllGames={() => state.restoreAllGames()}
            />
        {/if}
    </div>
{/if}

<DevTools />

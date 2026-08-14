<script lang="ts">
    import '$lib/styles/settings.scss';

    import { onMount } from 'svelte';

    import * as Dialog from '$lib/components/ui/dialog';
    import { Input } from '$lib/components/ui/input';
    import { Button } from '$lib/components/ui/button';
    import { PersonCreditCard, BrowserPluginCard } from '$lib/components';


    import { browserPluginManager } from '$lib/plugins';
    import type { BrowserPlugin } from '$lib/plugins';

    interface DeletedItem {
        key: string;
        title: string;
    }

    interface Props {
        currentUrl: string;
        deletedGamesList: DeletedItem[];
        onRestoreGame?: (gameKey: string) => void;
        onRestoreAllGames?: () => void;
    }

    let { currentUrl, deletedGamesList = [], onRestoreGame, onRestoreAllGames }: Props = $props();

    let rememberDuration = $state('1 day');
    let panicKey = $state('\\');
    let isListeningForPanicKey = $state(false);
    let isDarkMode = $state(false);

    const presets: Record<string, string> = {
        Clever: 'https://clever.com',
        'Google Classroom': 'https://classroom.google.com',
        Canvas: 'https://canvas.instructure.com',
        Google: 'https://google.com',
    };

    let selectedPreset = $state('Clever');
    let customUrlInput = $state('');
    let isCustomDialogOpen = $state(false);
    let currentRedirect = $state('https://clever.com');

    let browserPlugins = $state<BrowserPlugin[]>([]);

    let isPluginDialogOpen = $state(false);

    let pluginManifestUrl = $state('');

    let pluginError = $state('');

    let isInstallingPlugin = $state(false);

    let showRestartPrompt = $state(false);

    let restartReason = $state('The plugin has been installed successfully.');

    let pluginFileInput: HTMLInputElement | undefined = undefined;

    onMount(() => {
        rememberDuration = localStorage.getItem('remember_duration') || '1 day';

        panicKey = localStorage.getItem('panic_key') || '\\';

        isDarkMode = document.documentElement.classList.contains('dark');

        const savedRedirect = localStorage.getItem('cloak_redirect_url') || 'https://clever.com';

        currentRedirect = savedRedirect;

        const foundKey = Object.keys(presets).find((key) => presets[key] === savedRedirect);

        if (foundKey) {
            selectedPreset = foundKey;
        } else {
            selectedPreset = 'Custom';
            customUrlInput = savedRedirect;
        }

        browserPlugins = browserPluginManager.load();
    });

    function refreshBrowserPlugins() {
        browserPlugins = browserPluginManager.getAll();
    }

    function updateDuration(event: Event) {
        const target = event.target as HTMLSelectElement;

        const selected = target.value;

        rememberDuration = selected;

        localStorage.setItem('remember_duration', selected);

        if (selected === 'never') {
            localStorage.removeItem('saved_json_urls');

            localStorage.removeItem('remember_expiry');

            localStorage.removeItem('theme');
        } else if (currentUrl) {
            saveSession([currentUrl], selected);
        }
    }

    function saveSession(urls: string[], duration: string) {
        const now = Date.now();

        let durationMs = 0;

        if (duration === '1 day') {
            durationMs = 24 * 60 * 60 * 1000;
        } else if (duration === '3 days') {
            durationMs = 3 * 24 * 60 * 60 * 1000;
        }

        if (durationMs > 0) {
            localStorage.setItem('saved_json_urls', JSON.stringify(urls));

            localStorage.setItem('remember_expiry', (now + durationMs).toString());
        }
    }

    function listenForPanicKey() {
        isListeningForPanicKey = true;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();

            panicKey = e.key;

            localStorage.setItem('panic_key', e.key);

            isListeningForPanicKey = false;

            window.removeEventListener('keydown', handleKeyDown);
        };

        window.addEventListener('keydown', handleKeyDown);
    }

    function toggleTheme() {
        isDarkMode = !isDarkMode;

        if (isDarkMode) {
            document.documentElement.classList.add('dark');

            if (rememberDuration !== 'never') {
                localStorage.setItem('theme', 'dark');
            }
        } else {
            document.documentElement.classList.remove('dark');

            if (rememberDuration !== 'never') {
                localStorage.setItem('theme', 'light');
            }
        }
    }

    function handleSelectChange(event: Event) {
        const target = event.target as HTMLSelectElement;

        const value = target.value;

        if (value === 'Custom') {
            isCustomDialogOpen = true;
        } else {
            selectedPreset = value;

            const targetUrl = presets[value];

            saveRedirect(targetUrl);
        }
    }

    function saveCustomUrl() {
        let formatted = customUrlInput.trim();

        if (!formatted) {
            return;
        }

        if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
            formatted = 'https://' + formatted;
        }

        customUrlInput = formatted;

        saveRedirect(formatted);

        selectedPreset = 'Custom';

        isCustomDialogOpen = false;
    }

    function saveRedirect(url: string) {
        localStorage.setItem('cloak_redirect_url', url);

        currentRedirect = url;
    }

    function openPluginDialog() {
        pluginManifestUrl = '';
        pluginError = '';
        isPluginDialogOpen = true;
    }

    function closePluginDialog() {
        if (isInstallingPlugin) {
            return;
        }

        isPluginDialogOpen = false;

        pluginManifestUrl = '';

        pluginError = '';
    }

    async function installPlugin() {
        pluginError = '';

        const url = pluginManifestUrl.trim();

        if (!url) {
            pluginError = 'Enter a plugin manifest URL.';

            return;
        }

        isInstallingPlugin = true;

        try {
            await browserPluginManager.register(url);

            refreshBrowserPlugins();

            isPluginDialogOpen = false;

            pluginManifestUrl = '';

            restartReason =
                'The plugin was installed successfully and needs a restart to start running.';

            showRestartPrompt = true;
        } catch (error) {
            pluginError = error instanceof Error ? error.message : 'Failed to install plugin.';
        } finally {
            isInstallingPlugin = false;
        }
    }

    function restartApp() {
        window.location.reload();
    }

    function laterRestart() {
        showRestartPrompt = false;
    }

    function handlePluginChanged() {
        refreshBrowserPlugins();

        restartReason =
            'Your plugin settings changed. Restart Retini for the change to take effect.';

        showRestartPrompt = true;
    }

    function exportPlugins() {
        const blob = browserPluginManager.exportBlob();

        const url = URL.createObjectURL(blob);

        const anchor = document.createElement('a');

        anchor.href = url;
        anchor.download = 'retini-plugins.json';

        document.body.appendChild(anchor);

        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(url);
    }

    function openImportPicker() {
        pluginFileInput?.click();
    }

    async function importPlugins(event: Event) {
        const input = event.target as HTMLInputElement;

        const file = input.files?.[0];

        if (!file) {
            return;
        }

        try {
            const text = await file.text();

            await browserPluginManager.import(text);

            refreshBrowserPlugins();

            restartReason = 'Your plugins were imported successfully. Restart Retini to load them.';

            showRestartPrompt = true;
        } catch (error) {
            pluginError = error instanceof Error ? error.message : 'Failed to import plugins.';
        } finally {
            input.value = '';
        }
    }
</script>

<div class="settings-container">
    <div class="settings-card">
        <h2>Settings</h2>

        <p class="subtitle">
            Manage your session preferences, appearance, tab cloaking, plugins, and hidden games.
        </p>

        <div class="setting-group">
            <label for="remember-select" class="setting-label">
                <span class="title"> Remember Me For </span>

                <span class="desc"> Choose how long to bypass typing the JSON URL. </span>
            </label>

            <select
                id="remember-select"
                value={rememberDuration}
                onchange={updateDuration}
                class="setting-select"
            >
                <option value="never"> Never </option>

                <option value="1 day"> 1 Day </option>

                <option value="3 days"> 3 Days </option>
            </select>
        </div>

        <hr class="divider" />

        <div class="setting-group">
            <label for="cloak-select" class="setting-label">
                <span class="title"> Cloak Redirect Target </span>

                <span class="desc">
                    Destination page opened in the original tab when auto-cloaking.
                </span>
            </label>

            <div class="cloak-select-wrapper" style="display:flex;flex-direction:column;gap:8px;">
                <select
                    id="cloak-select"
                    value={selectedPreset}
                    onchange={handleSelectChange}
                    class="setting-select"
                >
                    {#each Object.keys(presets) as name}
                        <option value={name}>
                            {name}
                        </option>
                    {/each}

                    <option value="Custom"> Custom URL... </option>
                </select>

                {#if selectedPreset === 'Custom'}
                    <div style="display:flex;gap:8px;align-items:center;margin-top:4px;">
                        <Input
                            type="text"
                            bind:value={customUrlInput}
                            placeholder="e.g. google.com"
                        />

                        <Button variant="default" size="sm" onclick={saveCustomUrl}>Save</Button>
                    </div>
                {/if}
            </div>
        </div>

        <hr class="divider" />

        <div class="setting-group">
            <div class="setting-label">
                <span class="title"> Panic Key </span>

                <span class="desc">
                    Pressing this key clears all local data and resets the page.
                </span>
            </div>

            <Button variant="secondary" onclick={listenForPanicKey}>
                {isListeningForPanicKey ? 'Press any key...' : `Key: [ ${panicKey} ]`}
            </Button>
        </div>

        <hr class="divider" />

        <div class="setting-group">
            <div class="setting-label">
                <span class="title"> Theme Mode </span>

                <span class="desc"> Toggle between Light and Dark interface modes. </span>
            </div>

            <Button variant="outline" onclick={toggleTheme}>
                {isDarkMode ? 'Dark' : 'Light'}
            </Button>
        </div>

        <hr class="divider" />

        <div class="setting-group vertical-group">
            <div class="setting-header-row">
                <div class="setting-label">
                    <span class="title"> Browser Plugins </span>

                    <span class="desc">
                        Install plugins published by Retini developers or third-party developers.
                    </span>
                </div>

                <Button variant="outline" size="sm" onclick={openPluginDialog}>
                    Register Plugin
                </Button>
            </div>

            {#if browserPlugins.length === 0}
                <div
                    class="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-5 text-center"
                >
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        No browser plugins installed.
                    </p>

                    <Button variant="outline" size="sm" onclick={openPluginDialog} class="mt-3">
                        Register a Plugin
                    </Button>
                </div>
            {:else}
                <div class="flex flex-col gap-3">
                    {#each browserPlugins as plugin (plugin.id)}
                        <BrowserPluginCard {plugin} onChanged={handlePluginChanged} />
                    {/each}
                </div>
            {/if}

            <div class="flex flex-wrap gap-2 mt-2">
                <Button variant="outline" size="sm" onclick={openImportPicker}>
                    Import Plugins
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onclick={exportPlugins}
                    disabled={browserPlugins.length === 0}
                >
                    Export Plugins
                </Button>

                <input
                    bind:this={pluginFileInput}
                    type="file"
                    accept=".json,application/json"
                    class="hidden"
                    onchange={importPlugins}
                />
            </div>

            {#if pluginError && !isPluginDialogOpen}
                <p class="text-sm text-red-500 whitespace-pre-line">
                    {pluginError}
                </p>
            {/if}
        </div>

        <hr class="divider" />

        <div class="setting-group vertical-group">
            <div class="setting-header-row">
                <div class="setting-label">
                    <span class="title"> Removed Games </span>

                    <span class="desc">
                        Refresh games you've hidden back onto your dashboard.
                    </span>
                </div>

                {#if deletedGamesList.length > 0}
                    <Button variant="secondary" size="sm" onclick={onRestoreAllGames}>
                        Refresh All
                    </Button>
                {/if}
            </div>

            {#if deletedGamesList.length === 0}
                <p class="empty-msg">No removed games found.</p>
            {:else}
                <ul class="deleted-list">
                    {#each deletedGamesList as item}
                        <li class="deleted-item">
                            <span class="game-key-text">
                                {item.title}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                onclick={() => onRestoreGame?.(item.key)}
                            >
                                Refresh
                            </Button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>

        <hr class="divider" />

        <div class="setting-group vertical-group">
            <div class="setting-header-row" style="margin-bottom:8px;">
                <div class="setting-label">
                    <span class="title"> Credits & Contributors </span>

                    <span class="desc"> The goats behind this project. </span>
                </div>

                <a
                    href="https://github.com/retini-services"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="font-size:0.8rem;font-weight:600;color:#38bdf8;text-decoration:none;"
                >
                    Retini Services Org ↗
                </a>
            </div>

            <div style="display:flex;flex-direction:column;gap:8px;">
                <PersonCreditCard
                    name="IdontCodddde"
                    role="UI Designer, App Co-designer, Creator, Maintainer, backend Dev & Lead Developer. the alien behind this all."
                    githubUrl="https://github.com/idontcodddde"
                />

                <PersonCreditCard
                    name="Mor6767"
                    role="Lead Fundraiser, App Co-designer"
                    githubUrl="https://github.com/mor6767"
                />

                <PersonCreditCard
                    name="Ilike2dollabills"
                    role="Frontend Game suggester, App design assister, Maintainer"
                    githubUrl="https://github.com/ilike2dollabills"
                />
            </div>
        </div>
    </div>
</div>

<Dialog.Root bind:open={isCustomDialogOpen}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Custom Cloak Redirect</Dialog.Title>

            <Dialog.Description>
                Choose the URL you want the main tab to redirect to when cloaking.
            </Dialog.Description>
        </Dialog.Header>

        <div class="dialog-body space-y-2 py-2">
            <label for="custom-url-input" class="text-xs font-semibold text-slate-300">
                Choose URL
            </label>

            <Input
                id="custom-url-input"
                type="text"
                bind:value={customUrlInput}
                placeholder="e.g. google.com"
            />
        </div>

        <Dialog.Footer>
            <Button variant="ghost" onclick={() => (isCustomDialogOpen = false)}>Cancel</Button>

            <Button variant="default" onclick={saveCustomUrl}>Save URL</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={isPluginDialogOpen}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Register Browser Plugin</Dialog.Title>

            <Dialog.Description>
                Enter the URL of a plugin's manifest.json file. Retini will download and validate
                the manifest before installing it.
            </Dialog.Description>
        </Dialog.Header>

        <div class="dialog-body space-y-3 py-3">
            <label for="plugin-manifest-url" class="text-xs font-semibold text-slate-300">
                Plugin Manifest URL
            </label>

            <Input
                id="plugin-manifest-url"
                type="url"
                bind:value={pluginManifestUrl}
                placeholder="https://example.github.io/plugin/manifest.json"
                disabled={isInstallingPlugin}
                onkeydown={(event) => {
                    if (event.key === 'Enter') {
                        installPlugin();
                    }
                }}
            />

            {#if pluginError}
                <p class="text-sm text-red-500 whitespace-pre-line">
                    {pluginError}
                </p>
            {/if}
        </div>

        <Dialog.Footer>
            <Button variant="ghost" onclick={closePluginDialog} disabled={isInstallingPlugin}>
                Cancel
            </Button>

            <Button variant="default" onclick={installPlugin} disabled={isInstallingPlugin}>
                {isInstallingPlugin ? 'Installing...' : 'Install Plugin'}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showRestartPrompt}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Restart Retini</Dialog.Title>

            <Dialog.Description>
                {restartReason}
            </Dialog.Description>
        </Dialog.Header>

        <div class="py-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
                Restarting will reload the current Retini page and load your enabled browser
                plugins.
            </p>
        </div>

        <Dialog.Footer>
            <Button variant="ghost" onclick={laterRestart}>Later</Button>

            <Button variant="default" onclick={restartApp}>Restart Now</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

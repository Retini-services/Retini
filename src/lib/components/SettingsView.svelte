<script lang="ts">
    import '../styles/settings.scss';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Input } from '$lib/components/ui/input';
    import { Button } from '$lib/components/ui/button';
    import { onMount } from 'svelte';
    import { PersonCredit } from '$lib/components';

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
    });

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

        if (duration === '1 day') durationMs = 24 * 60 * 60 * 1000;
        else if (duration === '3 days') durationMs = 3 * 24 * 60 * 60 * 1000;

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
        if (!formatted) return;

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
</script>

<div class="settings-container">
    <div class="settings-card">
        <h2>Settings</h2>
        <p class="subtitle">
            Manage your session preferences, appearance, tab cloaking, and hidden games.
        </p>

        <div class="setting-group">
            <label for="remember-select" class="setting-label">
                <span class="title">Remember Me For</span>
                <span class="desc">Choose how long to bypass typing the JSON URL.</span>
            </label>
            <select
                id="remember-select"
                value={rememberDuration}
                onchange={updateDuration}
                class="setting-select"
            >
                <option value="never">Never</option>
                <option value="1 day">1 Day</option>
                <option value="3 days">3 Days</option>
            </select>
        </div>

        <hr class="divider" />

        <!-- Tab Cloak Redirect Setting -->
        <div class="setting-group">
            <label for="cloak-select" class="setting-label">
                <span class="title">Cloak Redirect Target</span>
                <span class="desc"
                    >Destination page opened in the original tab when auto-cloaking.</span
                >
            </label>

            <div
                class="cloak-select-wrapper"
                style="display: flex; flex-direction: column; gap: 8px;"
            >
                <select
                    id="cloak-select"
                    value={selectedPreset}
                    onchange={handleSelectChange}
                    class="setting-select"
                >
                    {#each Object.keys(presets) as name}
                        <option value={name}>{name}</option>
                    {/each}
                    <option value="Custom">Custom URL...</option>
                </select>

                {#if selectedPreset === 'Custom'}
                    <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
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
                <span class="title">Panic Key</span>
                <span class="desc"
                    >Pressing this key clears all local data and resets the page.</span
                >
            </div>
            <Button variant="secondary" onclick={listenForPanicKey}>
                {isListeningForPanicKey ? 'Press any key...' : `Key: [ ${panicKey} ]`}
            </Button>
        </div>

        <hr class="divider" />

        <div class="setting-group">
            <div class="setting-label">
                <span class="title">Theme Mode</span>
                <span class="desc">Toggle between Light and Dark interface modes.</span>
            </div>

            <Button variant="outline" onclick={toggleTheme}>
                {isDarkMode ? 'Dark' : 'Light'}
            </Button>
        </div>

        <hr class="divider" />

        <div class="setting-group vertical-group">
            <div class="setting-header-row">
                <div class="setting-label">
                    <span class="title">Removed Games</span>
                    <span class="desc">Refresh games you've hidden back onto your dashboard.</span>
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
                            <span class="game-key-text">{item.title}</span>
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
            <div class="setting-header-row" style="margin-bottom: 8px;">
                <div class="setting-label">
                    <span class="title">Credits & Contributors</span>
                    <span class="desc">The awesome people behind this project.</span>
                </div>
                <a
                    href="https://github.com/retini-services"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="font-size: 0.8rem; font-weight: 600; color: #38bdf8; text-decoration: none;"
                >
                    Retini Services Org ↗
                </a>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px;">
                <PersonCredit
                    name="Allister"
                    role="UI Designer, App Co-designer, Creator, Maintainer, backend Dev & Lead Developer"
                    githubUrl="https://github.com/idontcodddde"
                />
                <PersonCredit
                    name="Morgan"
                    role="Fundraiser, App Co-designer"
                    githubUrl="https://github.com/mor6767"
                />
                <PersonCredit
                    name="Isaiah"
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
            <label for="custom-url-input" class="text-xs font-semibold text-slate-300"
                >Choose URL</label
            >
            <Input
                id="custom-url-input"
                type="text"
                bind:value={customUrlInput}
                placeholder="e.g. google.com or https://canvas.com"
            />
        </div>

        <Dialog.Footer>
            <Button variant="ghost" onclick={() => (isCustomDialogOpen = false)}>Cancel</Button>
            <Button variant="default" onclick={saveCustomUrl}>Save URL</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

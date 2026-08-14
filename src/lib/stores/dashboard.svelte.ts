import { browser } from "$app/environment";
import { toast } from "$lib/utils/toast";

export interface DeletedItem {
    key: string;
    title: string;
}

export class DashboardState {
    customUrl = $state("");
    loadedUrls = $state<string[]>([]);
    isValid = $state(false);
    isLoading = $state(false);
    gamesList = $state<Array<any>>([]);
    rawFetchedGames = $state<Array<any>>([]);
    deletedGamesList = $state<DeletedItem[]>([]);
    searchQuery = $state("");
    activeTab = $state("Overview");
    selectedGame = $state<{ title: string; url: string } | null>(null);
    isAddModalOpen = $state(false);
    plugins = $state<Array<any>>([]);

    filteredGames = $derived(
        this.gamesList.filter((game) => {
            if (!this.searchQuery.trim()) return true;

            const query = this.searchQuery.toLowerCase();
            const rawTags = game.tags || game.tag || [];
            const tagsArray: string[] = Array.isArray(rawTags)
                ? rawTags
                : typeof rawTags === "string"
                    ? rawTags.split(",").map((t) => t.trim())
                    : [];

            return (
                tagsArray.some((t) => t.toLowerCase().includes(query)) ||
                game.title?.toLowerCase().includes(query)
            );
        })
    );

    constructor() {
        if (browser) {
            this.init();
        }
    }

    init() {
        this.loadDeletedItemsFromStorage();
        this.loadPluginsFromStorage();
        this.executeActivePlugins();

        const savedDuration = localStorage.getItem("remember_duration");
        if (savedDuration && savedDuration !== "never") {
            const savedTheme = localStorage.getItem("theme");
            if (savedTheme === "dark") {
                document.documentElement.classList.add("dark");
            }
        }

        const expiryStr = localStorage.getItem("remember_expiry");
        const savedUrlsRaw = localStorage.getItem("saved_json_urls");

        if (savedDuration && savedDuration !== "never" && savedUrlsRaw && expiryStr) {
            const expiry = parseInt(expiryStr, 10);
            if (Date.now() < expiry) {
                try {
                    const urls: string[] = JSON.parse(savedUrlsRaw);
                    if (urls.length > 0) {
                        this.customUrl = urls[0];
                        this.loadAllUrls(urls, false);
                    }
                } catch {
                    localStorage.removeItem("saved_json_urls");
                    localStorage.removeItem("remember_expiry");
                }
            } else {
                localStorage.removeItem("saved_json_urls");
                localStorage.removeItem("remember_expiry");
            }
        }
    }

    loadDeletedItemsFromStorage() {
        if (!browser) return;
        try {
            const raw = localStorage.getItem("permanent_deleted_games_info");
            this.deletedGamesList = raw ? JSON.parse(raw) : [];
        } catch {
            this.deletedGamesList = [];
        }
    }

    async addPlugin(manifestUrl: string) {
        if (!browser || !manifestUrl.trim()) return;

        try {
            const res = await fetch(manifestUrl.trim());
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);

            const manifest = await res.json();

            if (!manifest.id || !manifest.name) {
                toast.error("Invalid Manifest", "The plugin manifest is missing required fields.");
                return;
            }

            if (this.plugins.some((p) => (p.manifest?.id || p.id) === manifest.id)) {
                toast.error("Already Installed", "This plugin is already registered.");
                return;
            }

            const newPlugin = {
                id: manifest.id,
                manifestUrl: manifestUrl.trim(),
                enabled: true,
                manifest
            };
            const updatedPlugins = [...this.plugins, newPlugin];
            this.plugins = updatedPlugins;

            localStorage.setItem("registered_plugins", JSON.stringify(updatedPlugins));
            this.executeActivePlugins();

            toast.success("Plugin Added", `Successfully registered "${manifest.name}".`);
        } catch (err) {
            console.error("Failed to add plugin:", err);
            toast.error("Error", "Failed to fetch or parse plugin manifest URL.");
        }
    }

    togglePlugin(id: string) {
        if (!browser) return;
        this.plugins = this.plugins.map((p) => {
            if ((p.manifest?.id || p.id) === id) {
                return { ...p, enabled: !p.enabled };
            }
            return p;
        });
        localStorage.setItem("registered_plugins", JSON.stringify(this.plugins));
        this.executeActivePlugins();
        toast.success("Plugin Updated", "Plugin toggle state saved.");
    }

    removePlugin(id: string) {
        if (!browser) return;
        const target = this.plugins.find((p) => (p.manifest?.id || p.id) === id);
        this.plugins = this.plugins.filter((p) => (p.manifest?.id || p.id) !== id);
        localStorage.setItem("registered_plugins", JSON.stringify(this.plugins));

        const scriptEl = document.getElementById(`plugin-script-${id}`);
        if (scriptEl) scriptEl.remove();

        toast.info("Plugin Removed", target ? `Uninstalled "${target.manifest?.name || target.name}".` : "Plugin removed.");
    }

    async refreshPlugin(id: string) {
        if (!browser) return;
        const target = this.plugins.find((p) => (p.manifest?.id || p.id) === id);
        if (!target || !target.manifestUrl) {
            toast.error("Error", "Plugin manifest URL not found for refresh.");
            return;
        }

        try {
            const res = await fetch(target.manifestUrl);
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);

            const manifest = await res.json();
            if (!manifest.id || !manifest.name) {
                toast.error("Invalid Manifest", "The updated plugin manifest is missing required fields.");
                return;
            }

            this.plugins = this.plugins.map((p) => {
                if ((p.manifest?.id || p.id) === id) {
                    return { ...p, manifest };
                }
                return p;
            });

            localStorage.setItem("registered_plugins", JSON.stringify(this.plugins));
            this.executeActivePlugins();
            toast.success("Plugin Refreshed", `Successfully updated "${manifest.name}".`);
        } catch (err) {
            console.error("Failed to refresh plugin:", err);
            toast.error("Error", "Failed to fetch updated plugin manifest.");
        }
    }

    executeActivePlugins() {
        if (!browser) return;

        this.plugins.forEach((p) => {
            const pluginId = p.manifest?.id || p.id;
            const scriptUrl = p.manifest?.main || p.manifest?.script;
            const existingScript = document.getElementById(`plugin-script-${pluginId}`);

            if (!p.enabled) {
                if (existingScript) existingScript.remove();
                return;
            }

            if (scriptUrl && !existingScript) {
                try {
                    let resolvedUrl = scriptUrl;
                    if (!scriptUrl.startsWith('http') && p.manifestUrl) {
                        const base = new URL(p.manifestUrl);
                        resolvedUrl = new URL(scriptUrl, base.origin + base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1)).href;
                    }

                    const script = document.createElement('script');
                    script.id = `plugin-script-${pluginId}`;
                    script.src = resolvedUrl;
                    script.async = true;
                    document.head.appendChild(script);
                } catch (e) {
                    console.error(`Failed to load script for plugin ${pluginId}:`, e);
                }
            }
        });
    }

    loadPluginsFromStorage() {
        if (!browser) return;
        try {
            const raw = localStorage.getItem("registered_plugins");
            if (raw) {
                const parsed = JSON.parse(raw);
                this.plugins = parsed.map((p: any) => {
                    if (!p.manifest) {
                        return {
                            id: p.id,
                            manifestUrl: p.manifestUrl,
                            enabled: p.enabled ?? true,
                            manifest: p
                        };
                    }
                    return p;
                });
            }
        } catch {
            this.plugins = [];
        }
    }

    exportPluginsJson() {
        if (!browser) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.plugins, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "plugins_backup.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        toast.success("Exported", "Plugins configuration downloaded.");
    }

    isGameDeleted(game: any, deletedItems: DeletedItem[]): boolean {
        const key = game.url || game.title;
        return deletedItems.some((item) => item.key === key);
    }

    triggerPanic() {
        if (!browser) return;
        localStorage.clear();
        sessionStorage.clear();
        toast.warning("Panic triggered", "All session data cleared.");
        window.location.reload();
    }

    refreshRemembrance() {
        if (!browser) return;
        const currentDuration = localStorage.getItem("remember_duration") || "1 day";

        if (currentDuration === "never") {
            toast.info("Remembrance Disabled", "Your setting is currently set to 'Never'. Change it in Settings.");
            return;
        }

        if (this.loadedUrls.length > 0) {
            this.saveSession(this.loadedUrls, currentDuration);
            toast.success("Remembrance Refreshed", `Session timer reset for ${currentDuration}.`);
        } else {
            toast.error("No Loaded Session", "Load a game source before refreshing remembrance.");
        }
    }

    async loadAllUrls(urls: string[], renewOnLoad = false) {
        if (!browser) return;
        this.isLoading = true;

        let combinedGames: any[] = [];
        let validUrls: string[] = [];

        for (const url of urls) {
            try {
                let isJsonValid = true;
                if (typeof (window as any).CheckJson === "function") {
                    isJsonValid = await (window as any).CheckJson(url);
                }

                if (isJsonValid) {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

                    const data = await res.json();
                    const games = data.games || (Array.isArray(data) ? data : null);

                    if (games && Array.isArray(games)) {
                        combinedGames = [...combinedGames, ...games];
                        validUrls.push(url);
                    }
                }
            } catch (err) {
                console.error("Failed loading URL:", url, err);
            }
        }

        this.isLoading = false;

        if (validUrls.length > 0) {
            this.rawFetchedGames = combinedGames;
            this.loadedUrls = validUrls;
            this.isValid = true;
            toast.success("Loaded games", "fetched games successfully from url provided.");

            this.gamesList = combinedGames.filter((g) => !this.isGameDeleted(g, this.deletedGamesList));

            if (renewOnLoad) {
                const currentDuration = localStorage.getItem("remember_duration") || "1 day";
                if (currentDuration !== "never") {
                    this.saveSession(validUrls, currentDuration);
                }
            }
        } else {
            this.isValid = false;
        }
    }

    async loadGames(url: string) {
        if (!url.trim()) return;
        await this.loadAllUrls([url.trim()], true);
    }

    testCustom() {
        if (this.customUrl && !this.isLoading) {
            this.loadGames(this.customUrl);
        }
    }

    async appendMoreGames(url: string): Promise<boolean> {
        if (!browser) return false;

        try {
            let isJsonValid = true;
            if (typeof (window as any).CheckJson === "function") {
                isJsonValid = await (window as any).CheckJson(url);
            }
            if (!isJsonValid) return false;

            const res = await fetch(url);
            const data = await res.json();
            const games = data.games || (Array.isArray(data) ? data : null);

            if (games && Array.isArray(games)) {
                this.rawFetchedGames = [...this.rawFetchedGames, ...games];

                const activeGames = games.filter((g: any) => !this.isGameDeleted(g, this.deletedGamesList));
                this.gamesList = [...this.gamesList, ...activeGames];

                if (!this.loadedUrls.includes(url)) {
                    this.loadedUrls = [...this.loadedUrls, url];
                }

                toast.success("Games Added", `Added content from ${url}`);
                return true;
            }
        } catch {
            toast.error("Error", "Failed to add game package.");
            return false;
        }
        return false;
    }

    deleteGame(gameToDelete: any) {
        this.gamesList = this.gamesList.filter((g) => g !== gameToDelete);

        const key = gameToDelete.url || gameToDelete.title;
        const title = gameToDelete.title || "Unnamed Game";

        if (key && !this.deletedGamesList.some((item) => item.key === key)) {
            const updatedList = [...this.deletedGamesList, { key, title }];
            this.deletedGamesList = updatedList;

            if (browser) {
                localStorage.setItem("permanent_deleted_games_info", JSON.stringify(updatedList));
            }
            toast.info("Game Removed", `"${title}" has been removed from view.`);
        }
    }

    restoreSingleGame(gameKey: string) {
        const target = this.deletedGamesList.find((i) => i.key === gameKey);
        const updatedList = this.deletedGamesList.filter((item) => item.key !== gameKey);
        this.deletedGamesList = updatedList;

        if (browser) {
            localStorage.setItem("permanent_deleted_games_info", JSON.stringify(updatedList));
        }

        this.gamesList = this.rawFetchedGames.filter((g) => !this.isGameDeleted(g, updatedList));
        toast.success("Game Restored", target ? `"${target.title}" is back on your dashboard.` : undefined);
    }

    restoreAllGames() {
        this.deletedGamesList = [];
        if (browser) {
            localStorage.removeItem("permanent_deleted_games_info");
        }
        this.gamesList = [...this.rawFetchedGames];
        toast.success("All Games Restored", "All hidden games are back on your dashboard.");
    }

    saveSession(urls: string[], duration: string) {
        if (!browser) return;
        const now = Date.now();
        let durationMs = 0;

        if (duration === "1 day") durationMs = 24 * 60 * 60 * 1000;
        else if (duration === "3 days") durationMs = 3 * 24 * 60 * 60 * 1000;

        if (durationMs > 0) {
            localStorage.setItem("saved_json_urls", JSON.stringify(urls));
            localStorage.setItem("remember_expiry", (now + durationMs).toString());
        }
    }
}

export const dashboard = new DashboardState();
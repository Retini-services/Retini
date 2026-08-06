import { browser } from "$app/environment";

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

    init() {
        this.loadDeletedItemsFromStorage();

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
                        this.loadAllUrls(urls);
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

    isGameDeleted(game: any, deletedItems: DeletedItem[]): boolean {
        const key = game.url || game.title;
        return deletedItems.some((item) => item.key === key);
    }

    triggerPanic() {
        if (!browser) return;
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    }

    async loadAllUrls(urls: string[]) {
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

            this.gamesList = combinedGames.filter((g) => !this.isGameDeleted(g, this.deletedGamesList));

            const currentDuration = localStorage.getItem("remember_duration") || "1 day";
            if (currentDuration !== "never") {
                this.saveSession(validUrls, currentDuration);
            }
        } else {
            this.isValid = false;
        }
    }

    async loadGames(url: string) {
        if (!url.trim()) return;
        await this.loadAllUrls([url.trim()]);
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

                const currentDuration = localStorage.getItem("remember_duration") || "1 day";
                if (currentDuration !== "never") {
                    this.saveSession(this.loadedUrls, currentDuration);
                }

                return true;
            }
        } catch {
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
        }
    }

    restoreSingleGame(gameKey: string) {
        const updatedList = this.deletedGamesList.filter((item) => item.key !== gameKey);
        this.deletedGamesList = updatedList;

        if (browser) {
            localStorage.setItem("permanent_deleted_games_info", JSON.stringify(updatedList));
        }

        this.gamesList = this.rawFetchedGames.filter((g) => !this.isGameDeleted(g, updatedList));
    }

    restoreAllGames() {
        this.deletedGamesList = [];
        if (browser) {
            localStorage.removeItem("permanent_deleted_games_info");
        }
        this.gamesList = [...this.rawFetchedGames];
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
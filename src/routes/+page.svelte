<script lang="ts">
	import "../styles/global.scss";
	import "../styles/main.scss";
	import { onMount } from "svelte";
	import { browser } from "$app/environment";
	interface DeletedItem {
		key: string;
		title: string;
	}

	let customUrl = $state("");
	let loadedUrls = $state<string[]>([]);
	let isValid = $state(false);
	let isLoading = $state(false);
	let gamesList = $state<Array<any>>([]);
	let rawFetchedGames = $state<Array<any>>([]);
	let deletedGamesList = $state<DeletedItem[]>([]);
	let searchQuery = $state("");
	let activeTab = $state("Overview");
	let selectedGame = $state<{ title: string; url: string } | null>(null);
	let isAddModalOpen = $state(false);

	function loadDeletedItemsFromStorage() {
		if (!browser) return;
		try {
			const raw = localStorage.getItem("permanent_deleted_games_info");
			deletedGamesList = raw ? JSON.parse(raw) : [];
		} catch {
			deletedGamesList = [];
		}
	}

	function isGameDeleted(game: any, deletedItems: DeletedItem[]): boolean {
		const key = game.url || game.title;
		return deletedItems.some((item) => item.key === key);
	}

	let filteredGames = $derived(
		gamesList.filter((game) => {
			if (!searchQuery.trim()) return true;

			const query = searchQuery.toLowerCase();
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

	function triggerPanic() {
		if (!browser) return;
		localStorage.clear();
		sessionStorage.clear();
		window.location.reload();
	}

	onMount(() => {
		loadDeletedItemsFromStorage();

		const handleKeyDown = (e: KeyboardEvent) => {
			const savedPanicKey = localStorage.getItem("panic_key") || "\\";
			if (e.key === savedPanicKey) {
				triggerPanic();
			}
		};
		window.addEventListener("keydown", handleKeyDown);

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
						customUrl = urls[0];
						loadAllUrls(urls);
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

		return () => window.removeEventListener("keydown", handleKeyDown);
	});

	async function loadAllUrls(urls: string[]) {
		if (!browser) return;
		isLoading = true;

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

		isLoading = false;

		if (validUrls.length > 0) {
			rawFetchedGames = combinedGames;
			loadedUrls = validUrls;
			isValid = true;

			gamesList = combinedGames.filter((g) => !isGameDeleted(g, deletedGamesList));

			const currentDuration = localStorage.getItem("remember_duration") || "1 day";
			if (currentDuration !== "never") {
				saveSession(validUrls, currentDuration);
			}
		} else {
			isValid = false;
		}
	}

	async function loadGames(url: string) {
		if (!url.trim()) return;
		await loadAllUrls([url.trim()]);
	}

	function handleInputKeyDown(e: KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();
			testCustom();
		}
	}

	function testCustom() {
		if (customUrl && !isLoading) {
			loadGames(customUrl);
		}
	}

	async function appendMoreGames(url: string): Promise<boolean> {
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
				rawFetchedGames = [...rawFetchedGames, ...games];

				const activeGames = games.filter((g: any) => !isGameDeleted(g, deletedGamesList));
				gamesList = [...gamesList, ...activeGames];

				if (!loadedUrls.includes(url)) {
					loadedUrls = [...loadedUrls, url];
				}

				const currentDuration = localStorage.getItem("remember_duration") || "1 day";
				if (currentDuration !== "never") {
					saveSession(loadedUrls, currentDuration);
				}

				return true;
			}
		} catch {
			return false;
		}
		return false;
	}

	function deleteGame(gameToDelete: any) {
		gamesList = gamesList.filter((g) => g !== gameToDelete);

		const key = gameToDelete.url || gameToDelete.title;
		const title = gameToDelete.title || "Unnamed Game";

		if (key && !deletedGamesList.some((item) => item.key === key)) {
			const updatedList = [...deletedGamesList, { key, title }];
			deletedGamesList = updatedList;

			if (browser) {
				localStorage.setItem("permanent_deleted_games_info", JSON.stringify(updatedList));
			}
		}
	}

	function restoreSingleGame(gameKey: string) {
		const updatedList = deletedGamesList.filter((item) => item.key !== gameKey);
		deletedGamesList = updatedList;

		if (browser) {
			localStorage.setItem("permanent_deleted_games_info", JSON.stringify(updatedList));
		}

		gamesList = rawFetchedGames.filter((g) => !isGameDeleted(g, updatedList));
	}

	function restoreAllGames() {
		deletedGamesList = [];
		if (browser) {
			localStorage.removeItem("permanent_deleted_games_info");
		}
		gamesList = [...rawFetchedGames];
	}

	function saveSession(urls: string[], duration: string) {
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

	function handleTabChange(tab: string) {
		activeTab = tab;
	}

	function openGame(game: { title: string; url: string }) {
		selectedGame = game;
	}

	function closeGame() {
		selectedGame = null;
	}
</script>

{#if selectedGame}
	<GameViewer 
		url={selectedGame.url} 
		title={selectedGame.title} 
		onClose={closeGame} 
	/>
{/if}

{#if isAddModalOpen}
	<AddGamesModal 
		onAdd={appendMoreGames} 
		onClose={() => (isAddModalOpen = false)} 
	/>
{/if}

{#if !isValid}
	<div class="main-center">
		<div class="test-card">
			<div class="field">
				<input 
					id="url-input"
					type="text" 
					bind:value={customUrl} 
					onkeydown={handleInputKeyDown}
					disabled={isLoading}
				/>
			</div>
		</div>
	</div>
{:else}
	<div class="dashboard-layout">
		<Navbar 
			{activeTab} 
			onTabChange={handleTabChange} 
			onOpenAddModal={() => (isAddModalOpen = true)}
		/>

		{#if activeTab === "Overview"}
			<main class="dashboard-content">
				<div class="header-section">
					<div class="header-title">
						<h2>My Games Dashboard</h2>
						<p class="subtitle">Loaded from: {loadedUrls.join(", ")}</p>
					</div>

					<div class="search-box">
						<input 
							type="text" 
							bind:value={searchQuery} 
							placeholder="Search by tag or title..."
						/>
					</div>
				</div>

				{#if filteredGames.length === 0}
					<p class="no-results">No games found matching "{searchQuery}"</p>
				{:else}
					<div class="games-grid">
						{#each filteredGames as game}
							<GameCard 
								{game} 
								onSelect={openGame} 
								onDelete={deleteGame}
							/>
						{/each}
					</div>
				{/if}
			</main>
		{:else if activeTab === "Settings"}
			<SettingsView 
				currentUrl={customUrl} 
				{deletedGamesList}
				onRestoreGame={restoreSingleGame} 
				onRestoreAllGames={restoreAllGames}
			/>
		{/if}
	</div>
{/if}
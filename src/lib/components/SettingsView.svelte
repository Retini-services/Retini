<script lang="ts">
	import "../../styles/settings.scss";
	import { onMount } from "svelte";

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

	let { 
		currentUrl, 
		deletedGamesList = [], 
		onRestoreGame, 
		onRestoreAllGames 
	}: Props = $props();

	let rememberDuration = $state("1 day");
	let panicKey = $state("\\");
	let isListeningForPanicKey = $state(false);
	let isDarkMode = $state(false);

	onMount(() => {
		rememberDuration = localStorage.getItem("remember_duration") || "1 day";
		panicKey = localStorage.getItem("panic_key") || "\\";
		isDarkMode = document.documentElement.classList.contains("dark");
	});

	function updateDuration(event: Event) {
		const target = event.target as HTMLSelectElement;
		const selected = target.value;
		rememberDuration = selected;
		localStorage.setItem("remember_duration", selected);

		if (selected === "never") {
			localStorage.removeItem("saved_json_urls");
			localStorage.removeItem("remember_expiry");
			localStorage.removeItem("theme");
		} else if (currentUrl) {
			saveSession([currentUrl], selected);
		}
	}

	function saveSession(urls: string[], duration: string) {
		const now = Date.now();
		let durationMs = 0;

		if (duration === "1 day") durationMs = 24 * 60 * 60 * 1000;
		else if (duration === "3 days") durationMs = 3 * 24 * 60 * 60 * 1000;

		if (durationMs > 0) {
			localStorage.setItem("saved_json_urls", JSON.stringify(urls));
			localStorage.setItem("remember_expiry", (now + durationMs).toString());
		}
	}

	function listenForPanicKey() {
		isListeningForPanicKey = true;
		const handleKeyDown = (e: KeyboardEvent) => {
			e.preventDefault();
			panicKey = e.key;
			localStorage.setItem("panic_key", e.key);
			isListeningForPanicKey = false;
			window.removeEventListener("keydown", handleKeyDown);
		};
		window.addEventListener("keydown", handleKeyDown);
	}

	function toggleTheme() {
		isDarkMode = !isDarkMode;
		if (isDarkMode) {
			document.documentElement.classList.add("dark");
			if (rememberDuration !== "never") {
				localStorage.setItem("theme", "dark");
			}
		} else {
			document.documentElement.classList.remove("dark");
			if (rememberDuration !== "never") {
				localStorage.setItem("theme", "light");
			}
		}
	}
</script>

<div class="settings-container">
	<div class="settings-card">
		<h2>Settings</h2>
		<p class="subtitle">Manage your session preferences, appearance, and hidden games.</p>

		<div class="setting-group">
			<label for="remember-select" class="setting-label">
				<span class="title">Remember Me For</span>
				<span class="desc">Choose how long to bypass typing the JSON URL.</span>
			</label>
			<select id="remember-select" value={rememberDuration} onchange={updateDuration} class="setting-select">
				<option value="never">Never</option>
				<option value="1 day">1 Day</option>
				<option value="3 days">3 Days</option>
			</select>
		</div>

		<hr class="divider" />

		<div class="setting-group">
			<div class="setting-label">
				<span class="title">Panic Key</span>
				<span class="desc">Pressing this key clears all local data and resets the page.</span>
			</div>
			<button class="key-bind-btn" onclick={listenForPanicKey}>
				{isListeningForPanicKey ? "Press any key..." : `Key: [ ${panicKey} ]`}
			</button>
		</div>

		<hr class="divider" />

		<div class="setting-group">
			<div class="setting-label">
				<span class="title">Theme Mode</span>
				<span class="desc">Toggle between Light and Dark interface modes.</span>
			</div>
			
			<button class="toggle-btn {isDarkMode ? 'active' : ''}" onclick={toggleTheme}>
				<span class="toggle-thumb"></span>
				<span class="toggle-text">{isDarkMode ? 'Dark' : 'Light'}</span>
			</button>
		</div>

		<hr class="divider" />

		<div class="setting-group vertical-group">
			<div class="setting-header-row">
				<div class="setting-label">
					<span class="title">Removed Games</span>
					<span class="desc">Refresh games you've hidden back onto your dashboard.</span>
				</div>
				{#if deletedGamesList.length > 0}
					<button class="restore-all-btn" onclick={onRestoreAllGames}>
						Refresh All
					</button>
				{/if}
			</div>

			{#if deletedGamesList.length === 0}
				<p class="empty-msg">No removed games found.</p>
			{:else}
				<ul class="deleted-list">
					{#each deletedGamesList as item}
						<li class="deleted-item">
							<span class="game-key-text">{item.title}</span>
							<button class="restore-btn" onclick={() => onRestoreGame?.(item.key)}>
								Refresh
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>
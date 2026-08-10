<script lang="ts">
	import "../../styles/game-card.scss";

	interface Game {
		title: string;
		rating: number | string;
		releaseDate: string;
		url: string;
		tag?: string | string[];
		tags?: string[];
		image?: string;
	}

	interface Props {
		game: Game;
		onSelect: (game: Game) => void;
		onDelete: (game: Game) => void;
	}

	let { game, onSelect, onDelete }: Props = $props();
	let isMenuOpen = $state(false);

	let formattedTags = $derived.by(() => {
		const rawTags = game.tags || game.tag || [];
		if (Array.isArray(rawTags)) {
			return rawTags;
		}
		if (typeof rawTags === "string") {
			return rawTags.split(",").map((t) => t.trim());
		}
		return [];
	});

	function toggleMenu(e: MouseEvent) {
		e.stopPropagation();
		isMenuOpen = !isMenuOpen;
	}

	function handleDelete(e: MouseEvent) {
		e.stopPropagation();
		isMenuOpen = false;
		onDelete(game);
	}

	function handleCardClick() {
		if (isMenuOpen) {
			isMenuOpen = false;
			return;
		}
		onSelect(game);
	}
</script>

<div 
	class="game-card" 
	onclick={handleCardClick}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === 'Enter' && handleCardClick()}
>
	<div class="card-header-actions">
		<button class="menu-btn" onclick={toggleMenu} aria-label="Game options">
			⋮
		</button>
		{#if isMenuOpen}
			<div class="dropdown-menu">
				<button class="dropdown-item delete" onclick={handleDelete}>
					🗑 Remove Game
				</button>
			</div>
		{/if}
	</div>

	<div class="card-content">
		<img 
			src={game.image || "https://picsum.photos/200/200"} 
			alt={game.title} 
			class="game-image" 
		/>
		
		<div class="game-info">
			<h3 class="game-title">{game.title}</h3>
			<p class="meta"><strong>Rating:</strong> {game.rating}/5</p>
			<p class="meta"><strong>Release:</strong> {game.releaseDate}</p>
		</div>
	</div>

	<div class="card-footer">
		<div class="tags-list">
			{#each formattedTags as tag}
				<span class="tag">{tag}</span>
			{/each}
		</div>
		<button class="play-btn">Play Game ▶</button>
	</div>
</div>
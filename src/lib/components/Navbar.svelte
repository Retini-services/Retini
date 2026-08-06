<script lang="ts">
	import "../../styles/navbar.scss";

	interface Props {
		activeTab: string;
		onTabChange: (tab: string) => void;
		onOpenAddModal: () => void;
	}

	let { activeTab, onTabChange, onOpenAddModal }: Props = $props();
	const tabs = ["Overview", "Settings"];
</script>

<header class="navbar">
	<div class="nav-container">
		<h1 class="logo">Retini</h1>

		<nav class="nav-links">
			{#each tabs as tab}
				<button 
					class="nav-tab {activeTab === tab ? 'active' : ''}" 
					onclick={() => onTabChange(tab)}
				>
					{tab}
				</button>
			{/each}
		</nav>

		<button class="add-games-btn" onclick={onOpenAddModal}>
			+ Add More Games
		</button>
	</div>
</header>
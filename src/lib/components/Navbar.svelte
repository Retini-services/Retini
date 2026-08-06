<script lang="ts">
	import "../../styles/navbar.scss";

	interface Props {
		activeTab: string;
		onTabChange: (tab: string) => void;
		onOpenAddModal: () => void;
		onRefreshRemembrance: () => void;
	}

	let { 
		activeTab, 
		onTabChange, 
		onOpenAddModal, 
		onRefreshRemembrance 
	}: Props = $props();

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

		<div class="nav-actions" style="display: flex; gap: 8px; align-items: center;">
			<Button variant="outline" size="sm" onclick={onRefreshRemembrance}>
				Refresh Remembrance
			</Button>
			<Button variant="default" size="sm" onclick={onOpenAddModal}>
				+ Add More Games
			</Button>
		</div>
	</div>
</header>
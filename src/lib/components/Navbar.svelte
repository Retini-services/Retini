<script lang="ts">
	import "../../styles/navbar.scss";
	import { Button } from "$lib/components/ui/button";

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
	<div class="nav-container" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; width: 100%;">
		<h1 class="logo" style="margin: 0; font-size: 1.25rem; font-weight: bold;">Retini</h1>

		<nav class="nav-links" style="display: flex; align-items: center; gap: 8px;">
			{#each tabs as tab}
				<button 
					type="button"
					class="nav-tab {activeTab === tab ? 'active' : ''}" 
					onclick={() => onTabChange(tab)}
					style="background: transparent; border: none; cursor: pointer; padding: 6px 12px; font-size: 0.95rem;"
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
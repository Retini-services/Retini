<script lang="ts">
	import "../../styles/game-viewer.scss";
	import { toast } from "$lib/utils/toast";
	import { onMount } from "svelte";

	interface Props {
		url: string;
		title: string;
		onClose: () => void;
	}

	let { url, title, onClose }: Props = $props();

	onMount(() => {
		toast.info("Launch", `Attempting to launch ${title}`);
	});
</script>

<div class="game-modal">
	<header class="modal-header">
		<div class="title-group">
			<h2>{title}</h2>
		</div>
		<button class="close-btn" onclick={onClose}>
			✕ Close Game
		</button>
	</header>

	<div class="iframe-container">
		<iframe 
			src={url} 
			title={title}
			sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
			allow="fullscreen"
		></iframe>
	</div>
</div>
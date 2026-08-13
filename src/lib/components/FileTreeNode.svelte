<script lang="ts">
	import { devTools, type FileNode } from "$lib/stores/DevTools.svelte.ts";
	import FileTreeNode from "./FileTreeNode.svelte";

	interface Props {
		node: FileNode;
	}

	let { node }: Props = $props();
</script>

<div class="tree-node">
	{#if node.type === "folder"}
		<button class="node-item folder" onclick={() => devTools.toggleFolder(node)}>
			<span class="arrow">{node.expanded ? "▼" : "▶"}</span>
			<span class="icon">📁</span>
			<span class="label">{node.name}</span>
		</button>
		{#if node.expanded && node.children}
			<div class="children-indent">
				{#each node.children as child}
					<FileTreeNode node={child} />
				{/each}
			</div>
		{/if}
	{:else}
		<div class="node-item file">
			<span class="icon">📄</span>
			<span class="label">{node.name}</span>
			<button class="preview-btn" onclick={() => devTools.openPreview(node.path)}>
				Inspect ↗
			</button>
		</div>
	{/if}
</div>

<style lang="scss">
	.tree-node {
		font-family: monospace;
		font-size: 0.75rem;
	}

	.node-item {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 6px;
		width: 100%;
		background: transparent;
		border: none;
		color: #cbd5e1;
		border-radius: 4px;
		cursor: pointer;
		text-align: left;

		&:hover {
			background: #1e293b;
		}

		&.folder {
			color: #38bdf8;
			font-weight: 600;
		}
	}

	.arrow {
		font-size: 0.65rem;
		width: 10px;
		color: #64748b;
	}

	.label {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.children-indent {
		margin-left: 14px;
		border-left: 1px solid #334155;
		padding-left: 4px;
	}

	.preview-btn {
		background: #0284c7;
		color: #fff;
		border: none;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.65rem;
		cursor: pointer;
		&:hover { background: #0369a1; }
	}
</style>
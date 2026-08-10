<script lang="ts">
	interface Props {
		name: string;
		role: string;
		githubUrl: string;
		avatarUrl?: string;
	}

	let { name, role, githubUrl }: Props = $props();
</script>

<div class="person-credit-card">
	<div class="person-info">
		<div>
			<h4 class="person-name">{name}</h4>
			<p class="person-role">{role}</p>
		</div>
	</div>
	<a href={githubUrl} target="_blank" rel="noopener noreferrer" class="github-link">
		GitHub ↗
	</a>
</div>

<style lang="scss">
	.person-credit-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #1e293b;
		border: 1px solid #334155;
		padding: 12px 16px;
		border-radius: 8px;
		transition: border-color 0.2s ease;

		&:hover {
			border-color: #38bdf8;
		}
	}

	.person-info {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.person-name {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 600;
		color: #f8fafc;
	}

	.person-role {
		margin: 0;
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.github-link {
		font-size: 0.8rem;
		font-weight: 600;
		color: #38bdf8;
		text-decoration: none;
		padding: 4px 8px;
		background: rgba(56, 189, 248, 0.1);
		border-radius: 4px;
		transition: background 0.2s ease;

		&:hover {
			background: rgba(56, 189, 248, 0.2);
		}
	}
</style>
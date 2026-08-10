<script lang="ts">
	import { page } from "$app/state";
</script>

<main class="error-container">
	<div class="error-card">
		<h1 class="error-code">{page.status}</h1>
		<h2>Welp son, you've reached a real error.</h2>
		<p class="error-message">
			{#if page.error?.message}
				{page.error.message}
			{:else}
				An unexpected error occurred while processing your request.
			{/if}
		</p>
		<a href="/" class="home-btn">Return to Home</a>
	</div>
</main>

<style lang="scss">
	.error-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		background: #0f172a;
		color: #f8fafc;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		padding: 16px;
	}

	.error-card {
		background: #1e293b;
		border: 1px solid #334155;
		padding: 32px;
		border-radius: 12px;
		text-align: center;
		max-width: 400px;
		width: 100%;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);

		.error-code {
			font-size: 4rem;
			font-weight: 800;
			color: #38bdf8;
			margin: 0 0 8px 0;
			line-height: 1;
		}

		h2 {
			font-size: 1.25rem;
			font-weight: 700;
			margin: 0 0 12px 0;
			color: #f8fafc;
		}

		.error-message {
			font-size: 0.85rem;
			color: #94a3b8;
			margin: 0 0 24px 0;
		}

		.home-btn {
			display: inline-block;
			background: #0284c7;
			color: #fff;
			padding: 8px 16px;
			border-radius: 6px;
			font-size: 0.85rem;
			font-weight: 600;
			text-decoration: none;
			transition: background 0.2s ease;

			&:hover {
				background: #0369a1;
			}
		}
	}
</style>
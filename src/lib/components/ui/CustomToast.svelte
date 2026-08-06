<script lang="ts">
	import { onMount } from "svelte";

	interface Props {
		type: "success" | "error" | "info" | "warning";
		message: string;
		description?: string;
		duration?: number;
	}

	let { type, message, description, duration = 4000 }: Props = $props();

	let progress = $state(100);

	onMount(() => {
		const startTime = Date.now();
		const interval = setInterval(() => {
			const elapsed = Date.now() - startTime;
			const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
			progress = remaining;

			if (remaining <= 0) {
				clearInterval(interval);
			}
		}, 16);

		return () => clearInterval(interval);
	});
</script>

<div class="custom-toast-container">
	<div class="toast-content">
		<div class="icon-wrapper {type}">
			{#if type === "success"}
				<div class="sa-icon sa-success animate">
					<span class="sa-line sa-tip"></span>
					<span class="sa-line sa-long"></span>
					<div class="sa-placeholder"></div>
					<div class="sa-fix"></div>
				</div>
			{:else if type === "error"}
				<div class="sa-icon sa-error">
					<span class="sa-x-mark">
						<span class="sa-line sa-left"></span>
						<span class="sa-line sa-right"></span>
					</span>
				</div>
			{:else if type === "warning"}
				<div class="sa-icon sa-warning">!</div>
			{:else}
				<div class="sa-icon sa-info">i</div>
			{/if}
		</div>

		<div class="text-wrapper">
			<h4 class="toast-title">{message}</h4>
			{#if description}
				<p class="toast-desc">{description}</p>
			{/if}
		</div>
	</div>

	<div class="timer-bar-track">
		<div 
			class="timer-bar-fill {type}" 
			style="width: {progress}%;"
		></div>
	</div>
</div>

<style lang="scss">
	.custom-toast-container {
		position: relative;
		width: 320px;
		background-color: var(--toast-bg, #ffffff);
		color: var(--toast-color, #0f172a);
		border: 1px solid var(--toast-border, #e2e8f0);
		border-radius: 10px;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		padding: 14px 16px 18px 16px;
	}

	:global(html.dark) .custom-toast-container {
		background-color: #1e293b;
		color: #f8fafc;
		border-color: #334155;
	}

	.toast-content {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.text-wrapper {
		display: flex;
		flex-direction: column;
		gap: 2px;

		.toast-title {
			margin: 0;
			font-size: 0.9rem;
			font-weight: 600;
			line-height: 1.2;
		}

		.toast-desc {
			margin: 0;
			font-size: 0.8rem;
			color: #64748b;
			line-height: 1.3;
		}
	}

	:global(html.dark) .toast-desc {
		color: #94a3b8 !important;
	}

	.timer-bar-track {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3px;
		background-color: rgba(0, 0, 0, 0.05);
	}

	.timer-bar-fill {
		height: 100%;
		transition: width 16ms linear;

		&.success { background-color: #22c55e; }
		&.error { background-color: #ef4444; }
		&.warning { background-color: #f59e0b; }
		&.info { background-color: #3b82f6; }
	}

	/* SweetAlert2 Animated Icons */
	.icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;

		.sa-icon {
			width: 28px;
			height: 28px;
			border-radius: 50%;
			position: relative;
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: bold;

			&.sa-success {
				border: 2px solid #22c55e;

				.sa-line {
					height: 2px;
					background-color: #22c55e;
					display: block;
					border-radius: 2px;
					position: absolute;

					&.sa-tip {
						width: 8px;
						left: 4px;
						top: 14px;
						transform: rotate(45deg);
						animation: animateSuccessTip 0.4s ease-out forwards;
					}

					&.sa-long {
						width: 14px;
						right: 3px;
						top: 12px;
						transform: rotate(-45deg);
						animation: animateSuccessLong 0.4s ease-out forwards;
					}
				}
			}

			&.sa-error {
				border: 2px solid #ef4444;

				.sa-line {
					position: absolute;
					height: 2px;
					width: 14px;
					background-color: #ef4444;

					&.sa-left { transform: rotate(45deg); }
					&.sa-right { transform: rotate(-45deg); }
				}
			}

			&.sa-warning {
				border: 2px solid #f59e0b;
				color: #f59e0b;
				font-size: 16px;
			}

			&.sa-info {
				border: 2px solid #3b82f6;
				color: #3b82f6;
				font-size: 16px;
			}
		}
	}

	/* Keyframe Animations */
	@keyframes animateSuccessTip {
		0% { width: 0; left: 1px; top: 10px; }
		54% { width: 0; left: 1px; top: 10px; }
		70% { width: 10px; left: -2px; top: 13px; }
		84% { width: 6px; left: 5px; top: 15px; }
		100% { width: 8px; left: 4px; top: 14px; }
	}

	@keyframes animateSuccessLong {
		0% { width: 0; right: 10px; top: 18px; }
		65% { width: 0; right: 10px; top: 18px; }
		84% { width: 16px; right: 0px; top: 11px; }
		100% { width: 14px; right: 3px; top: 12px; }
	}
</style>
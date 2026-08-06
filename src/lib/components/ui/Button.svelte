<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { cn } from "$lib/utils/cn";

	interface Props extends HTMLButtonAttributes {
		variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
		size?: "default" | "sm" | "lg" | "icon";
		children?: Snippet;
	}

	let {
		class: className,
		variant = "default",
		size = "default",
		type = "button",
		children,
		style = "",
		...restProps
	}: Props = $props();

	const variantClasses = {
		default: "bg-blue-600 hover:bg-blue-700 shadow-sm",
		secondary: "bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700",
		outline: "border border-slate-800 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-transparent dark:hover:bg-slate-800 shadow-sm",
		ghost: "hover:bg-slate-100 dark:hover:bg-slate-800",
		destructive: "bg-red-600 hover:bg-red-700 shadow-sm"
	};

	const sizeClasses = {
		default: "h-9 px-4 py-2 text-sm",
		sm: "h-8 px-3 text-xs",
		lg: "h-10 px-6 text-base",
		icon: "h-9 w-9 p-0"
	};
</script>

<button
	{type}
	class={cn(
		"btn-ui inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
		variantClasses[variant],
		sizeClasses[size],
		className
	)}
	style="color: var(--btn-text-color, #000000); {style}"
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</button>

<style lang="scss">
	:global(button.btn-ui) {
		color: #000000 !important;
	}
	
	:global(button.btn-ui:hover) {
		color: #cbd5e1 !important;
	}

	:global(html.dark button.btn-ui) {
		color: #ffffff !important;
	}

	:global(html.dark button.btn-ui:hover) {
		color: #94a3b8 !important;
	}
</style>
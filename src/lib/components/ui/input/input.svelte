<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	let { class: className, value = $bindable(''), ...restProps }: HTMLInputAttributes = $props();
</script>

<input
	bind:value
	class={cn(
		'flex h-14 w-full rounded-2xl border border-input bg-card px-4 text-base font-semibold placeholder:font-normal placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...restProps}
/>

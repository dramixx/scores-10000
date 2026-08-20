<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		open = $bindable(false),
		title,
		description,
		showClose = true,
		contentClass,
		children,
		footer
	}: {
		open?: boolean;
		title?: string;
		description?: string;
		showClose?: boolean;
		contentClass?: string;
		children?: import('svelte').Snippet;
		footer?: import('svelte').Snippet;
	} = $props();
</script>

<DialogPrimitive.Root bind:open>
	<DialogPrimitive.Portal>
		<DialogPrimitive.Overlay
			class="fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
		/>
		<DialogPrimitive.Content
			class={cn(
				'fixed top-auto bottom-0 left-1/2 z-50 max-h-[85vh] w-full max-w-md -translate-x-1/2 overflow-y-auto rounded-t-3xl bg-popover p-6 shadow-lg outline-none sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 sm:rounded-3xl',
				'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4',
				contentClass
			)}
		>
			<div class="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden"></div>
			{#if title || showClose}
				<div class="mb-4 flex items-start justify-between gap-4">
					<div>
						{#if title}
							<DialogPrimitive.Title class="text-xl font-extrabold">{title}</DialogPrimitive.Title>
						{/if}
						{#if description}
							<DialogPrimitive.Description class="mt-1 text-sm text-muted-foreground">
								{description}
							</DialogPrimitive.Description>
						{/if}
					</div>
					{#if showClose}
						<DialogPrimitive.Close
							class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
						>
							<XIcon class="h-4 w-4" />
							<span class="sr-only">Fermer</span>
						</DialogPrimitive.Close>
					{/if}
				</div>
			{/if}
			{@render children?.()}
			{#if footer}
				<div class="mt-6">
					{@render footer()}
				</div>
			{/if}
		</DialogPrimitive.Content>
	</DialogPrimitive.Portal>
</DialogPrimitive.Root>

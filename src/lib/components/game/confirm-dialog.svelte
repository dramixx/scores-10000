<script lang="ts">
	import { Dialog } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';

	let {
		open = $bindable(false),
		title,
		description,
		confirmLabel = 'Confirmer',
		cancelLabel = 'Annuler',
		variant = 'primary',
		onconfirm
	}: {
		open?: boolean;
		title: string;
		description: string;
		confirmLabel?: string;
		cancelLabel?: string;
		variant?: 'primary' | 'destructive';
		onconfirm: () => void;
	} = $props();

	function confirm() {
		onconfirm();
		open = false;
	}
</script>

<Dialog bind:open {title} {description} showClose={false}>
	{#snippet footer()}
		<div class="flex gap-3">
			<Button variant="secondary" class="flex-1" onclick={() => (open = false)}>
				{cancelLabel}
			</Button>
			<Button {variant} class="flex-1" onclick={confirm}>
				{confirmLabel}
			</Button>
		</div>
	{/snippet}
</Dialog>

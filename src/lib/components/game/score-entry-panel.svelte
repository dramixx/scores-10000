<script lang="ts">
	import { formatScore } from '$lib/format-time';
	import { MAX_TURN_SCORE, WINNING_SCORE } from '$lib/game/types';
	import { Button } from '$lib/components/ui/button';
	import DeleteIcon from '@lucide/svelte/icons/delete';

	let {
		playerName,
		cumulative,
		disabled = false,
		onsubmit
	}: {
		playerName: string;
		cumulative: number;
		disabled?: boolean;
		onsubmit: (score: number) => void;
	} = $props();

	let draft = $state(0);
	let error = $state<string | null>(null);

	const remaining = $derived(Math.max(WINNING_SCORE - cumulative, 0));
	const quickAdds = [50, 100, 300, 500, 1000];

	function reset() {
		draft = 0;
		error = null;
	}

	// Reset the draft whenever the active player changes.
	$effect(() => {
		if (playerName) reset();
	});

	function pushDigit(digit: number) {
		error = null;
		const next = draft * 10 + digit;
		draft = next > MAX_TURN_SCORE ? draft : next;
	}

	function addQuick(amount: number) {
		error = null;
		draft = Math.min(draft + amount, MAX_TURN_SCORE);
	}

	function backspace() {
		error = null;
		draft = Math.floor(draft / 10);
	}

	function submitDraft() {
		if (draft <= 0) return;
		if (draft > MAX_TURN_SCORE) {
			error = `Le score ne peut pas dépasser ${formatScore(MAX_TURN_SCORE)}.`;
			return;
		}
		onsubmit(draft);
		reset();
	}

	function submitCross() {
		onsubmit(0);
		reset();
	}
</script>

<div
	class="rounded-t-3xl border-t border-border bg-popover p-5 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]"
>
	<div class="mb-3 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<span class="h-2 w-2 rounded-full bg-destructive"></span>
			<span class="font-bold">{playerName}</span>
		</div>
		<span class="text-xs text-muted-foreground">reste {formatScore(remaining)} pts</span>
	</div>

	<div class="mb-4 flex h-14 items-center justify-between rounded-2xl bg-secondary px-4">
		{#if draft > 0}
			<span class="text-2xl font-black tabular-nums">{formatScore(draft)}</span>
		{:else}
			<span class="text-2xl font-normal text-muted-foreground">Tour</span>
		{/if}
		<button
			type="button"
			class="flex h-9 w-9 items-center justify-center rounded-full bg-card text-muted-foreground disabled:opacity-40"
			aria-label="Effacer le dernier chiffre"
			disabled={draft === 0}
			onclick={backspace}
		>
			<DeleteIcon class="h-4 w-4" />
		</button>
	</div>

	{#if error}
		<p class="mb-3 text-sm font-semibold text-destructive" role="alert">{error}</p>
	{/if}

	<div class="mb-3 grid grid-cols-5 gap-2">
		{#each quickAdds as amount (amount)}
			<button
				type="button"
				class="h-10 rounded-xl bg-secondary text-sm font-bold text-secondary-foreground active:scale-95"
				onclick={() => addQuick(amount)}
			>
				+{formatScore(amount)}
			</button>
		{/each}
	</div>

	<div class="mb-3 grid grid-cols-5 gap-2">
		{#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as digit (digit)}
			<button
				type="button"
				class="h-12 rounded-xl bg-secondary text-lg font-bold text-secondary-foreground active:scale-95"
				onclick={() => pushDigit(digit)}
			>
				{digit}
			</button>
		{/each}
		<button
			type="button"
			class="h-12 rounded-xl bg-secondary text-lg font-bold text-secondary-foreground active:scale-95"
			onclick={() => pushDigit(0)}
		>
			0
		</button>
	</div>

	<div class="grid grid-cols-3 gap-2">
		<Button
			variant="destructive"
			class="col-span-1 h-14 bg-destructive/10 text-destructive hover:bg-destructive/20"
			{disabled}
			onclick={submitCross}
		>
			✕ Croix
		</Button>
		<Button
			variant="success"
			class="col-span-2 h-14"
			disabled={disabled || draft <= 0}
			onclick={submitDraft}
		>
			Valider
		</Button>
	</div>
</div>

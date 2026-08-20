<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import ConfirmDialog from '$lib/components/game/confirm-dialog.svelte';
	import RulesDialog from '$lib/components/game/rules-dialog.svelte';
	import { deleteGame, listGames, type GameSummary } from '$lib/game/storage';
	import { relativeTime } from '$lib/format-time';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';
	import Dice5Icon from '@lucide/svelte/icons/dice-5';

	let games = $state<GameSummary[]>([]);
	let rulesOpen = $state(false);
	let deleteTarget = $state<GameSummary | null>(null);
	let now = $state(Date.now());

	onMount(() => {
		games = listGames();
		const interval = setInterval(() => (now = Date.now()), 30_000);
		return () => clearInterval(interval);
	});

	function refresh() {
		games = listGames();
	}

	function resume(game: GameSummary) {
		goto(resolve('/game/[id]', { id: game.id }));
	}

	function confirmDelete() {
		if (!deleteTarget) return;
		deleteGame(deleteTarget.id);
		deleteTarget = null;
		refresh();
	}
</script>

<svelte:head>
	<title>10000 — Compteur de score</title>
</svelte:head>

<div class="flex min-h-svh flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-8">
	<header class="mb-1 flex items-center gap-2">
		<div
			class="flex h-9 w-9 items-center justify-center rounded-lg bg-card-active text-card-active-foreground"
		>
			<Dice5Icon class="h-5 w-5" />
		</div>
		<h1 class="text-4xl font-black tracking-tight">10000</h1>
	</header>
	<p class="mb-6 text-muted-foreground">
		Compteur de score. Vous lancez les dés, on compte les points.
	</p>

	<Button
		size="lg"
		class="mb-8 w-full rounded-2xl"
		onclick={() => goto(resolve('/new'))}
		aria-label="Créer une nouvelle partie"
	>
		<PlusIcon class="h-5 w-5" />
		Nouvelle partie
	</Button>

	{#if games.length > 0}
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-xs font-bold tracking-wide text-muted-foreground uppercase">
				Parties en cours
			</h2>
			<span class="text-xs text-muted-foreground">{games.length}</span>
		</div>
		<ul class="space-y-3">
			{#each games as game (game.id)}
				<li>
					<Card class="flex items-center justify-between gap-3 p-4">
						<div class="min-w-0">
							{#if game.valid}
								<p class="truncate font-bold">{game.playerNames.join(' · ')}</p>
								<p class="mt-0.5 text-xs text-muted-foreground">
									{relativeTime(game.updatedAt, now)}
								</p>
							{:else}
								<p class="truncate font-bold">Partie illisible</p>
								<p class="mt-0.5 text-xs font-semibold text-destructive">données illisibles</p>
							{/if}
						</div>
						<div class="flex shrink-0 items-center gap-2">
							<button
								type="button"
								class="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
								aria-label="Supprimer la partie"
								onclick={() => (deleteTarget = game)}
							>
								<XIcon class="h-4 w-4" />
							</button>
							<Button
								size="sm"
								variant={game.valid ? 'dark' : 'secondary'}
								disabled={!game.valid}
								onclick={() => resume(game)}
							>
								Reprendre
							</Button>
						</div>
					</Card>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="mt-auto pt-10 text-center">
		<button
			type="button"
			class="text-sm text-muted-foreground underline-offset-4 hover:underline"
			onclick={() => (rulesOpen = true)}
		>
			Règles du jeu →
		</button>
	</div>
</div>

<RulesDialog bind:open={rulesOpen} />

<ConfirmDialog
	bind:open={
		() => deleteTarget !== null,
		(v) => {
			if (!v) deleteTarget = null;
		}
	}
	title="Supprimer la partie ?"
	description={deleteTarget
		? `La partie de ${deleteTarget.valid ? deleteTarget.playerNames.join(', ') : 'joueurs inconnus'} sera définitivement supprimée.`
		: ''}
	confirmLabel="Supprimer"
	variant="destructive"
	onconfirm={confirmDelete}
/>

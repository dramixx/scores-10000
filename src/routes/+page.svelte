<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import ConfirmDialog from '$lib/components/game/confirm-dialog.svelte';
	import RulesDialog from '$lib/components/game/rules-dialog.svelte';
	import {
		deleteGame,
		getStorageUsage,
		listGames,
		STORAGE_WARNING_RATIO,
		type GameSummary,
		type StorageUsage
	} from '$lib/game/storage';
	import { relativeTime, formatScore } from '$lib/format-time';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';
	import Dice5Icon from '@lucide/svelte/icons/dice-5';
	import TrophyIcon from '@lucide/svelte/icons/trophy';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	let games = $state<GameSummary[]>([]);
	let rulesOpen = $state(false);
	let deleteTarget = $state<GameSummary | null>(null);
	let now = $state(Date.now());
	let storageUsage = $state<StorageUsage | null>(null);

	const inProgressGames = $derived(games.filter((g) => !g.valid || g.status === 'in_progress'));
	const finishedGames = $derived(games.filter((g) => g.valid && g.status === 'finished'));
	const storageWarning = $derived(
		storageUsage && storageUsage.ratio >= STORAGE_WARNING_RATIO
			? Math.min(100, Math.round(storageUsage.ratio * 100))
			: null
	);

	onMount(() => {
		refresh();
		const interval = setInterval(() => (now = Date.now()), 30_000);
		return () => clearInterval(interval);
	});

	function refresh() {
		games = listGames();
		storageUsage = getStorageUsage();
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

	{#if storageWarning !== null}
		<div class="mb-6 flex items-start gap-3 rounded-2xl bg-destructive/10 p-4 text-destructive">
			<TriangleAlertIcon class="h-5 w-5 shrink-0" />
			<p class="text-sm font-semibold">
				Le stockage local est presque plein ({storageWarning} %). Supprimez d'anciennes parties ci-dessous
				pour libérer de la place.
			</p>
		</div>
	{/if}

	{#if inProgressGames.length > 0}
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-xs font-bold tracking-wide text-muted-foreground uppercase">
				Parties en cours
			</h2>
			<span class="text-xs text-muted-foreground">{inProgressGames.length}</span>
		</div>
		<ul class="mb-8 space-y-3">
			{#each inProgressGames as game (game.id)}
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

	{#if finishedGames.length > 0}
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-xs font-bold tracking-wide text-muted-foreground uppercase">
				Parties terminées
			</h2>
			<span class="text-xs text-muted-foreground">{finishedGames.length}</span>
		</div>
		<ul class="space-y-3">
			{#each finishedGames as game (game.id)}
				<li>
					<Card class="flex items-center justify-between gap-3 p-4">
						<div class="min-w-0">
							<p class="truncate font-bold">{game.playerNames.join(' · ')}</p>
							<div class="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
								{#if game.winnerName}
									<TrophyIcon class="h-3 w-3 shrink-0 text-accent-blue" />
									<span class="truncate"
										>{game.winnerName} · {formatScore(game.winnerScore ?? 0)}</span
									>
								{/if}
							</div>
							<p class="mt-0.5 text-xs text-muted-foreground">
								{relativeTime(game.updatedAt, now)}
							</p>
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
							<Button size="sm" variant="secondary" onclick={() => resume(game)}>Voir</Button>
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

<script lang="ts">
	import Celebration from './celebration.svelte';
	import { Button } from '$lib/components/ui/button';
	import { formatDuration, formatScore } from '$lib/format-time';
	import type { Game } from '$lib/game/types';
	import { computeStats } from '$lib/game/engine';

	let {
		game,
		onRestart,
		onHome,
		onShowTable
	}: {
		game: Game;
		onRestart: () => void;
		onHome: () => void;
		onShowTable: () => void;
	} = $props();

	const stats = $derived(computeStats(game));
	const winner = $derived(stats.ranking[0]);
	const confettiPieces = Array.from({ length: 18 }, (_v, i) => i);
</script>

<Celebration />

<div class="flex flex-col gap-6 px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-8">
	<div
		class="relative overflow-hidden rounded-3xl p-6 text-white"
		style="background: linear-gradient(135deg, var(--victory-from), var(--victory-to));"
	>
		<div class="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
			{#each confettiPieces as i (i)}
				<span
					class="absolute h-2 w-3 rounded-sm"
					style="
						left: {(i * 37) % 100}%;
						top: {(i * 53) % 100}%;
						background: {['#fff', '#ffd166', '#ef476f', '#06d6a0'][i % 4]};
						transform: rotate({(i * 41) % 360}deg);
					"
				></span>
			{/each}
		</div>
		<div class="relative">
			<p class="text-xs font-bold tracking-wide uppercase opacity-90">Vainqueur</p>
			<p class="mt-1 text-3xl font-black">{winner?.player.name}</p>
			<p class="text-5xl font-black tabular-nums">{formatScore(winner?.score ?? 0)}</p>
			{#if stats.ranking.length > 1}
				<p class="mt-1 text-sm opacity-90">
					+{formatScore(stats.winMargin)} points d'avance
				</p>
			{/if}
		</div>
	</div>

	<div>
		<h2 class="mb-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">Classement</h2>
		<ul class="space-y-2">
			{#each stats.ranking as entry, i (entry.player.id)}
				<li
					class="flex items-center justify-between rounded-2xl bg-card p-3 shadow-sm"
					class:ring-2={i === 0}
					class:ring-accent-blue={i === 0}
				>
					<div class="flex items-center gap-3">
						<span
							class="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
							class:bg-accent-blue={i === 0}
							class:text-accent-blue-foreground={i === 0}
							class:bg-secondary={i !== 0}
						>
							{i + 1}
						</span>
						<span class="font-bold">{entry.player.name}</span>
					</div>
					<span class="font-black tabular-nums">{formatScore(entry.score)}</span>
				</li>
			{/each}
		</ul>
	</div>

	<div>
		<h2 class="mb-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">
			Statistiques
		</h2>
		<div class="grid grid-cols-2 gap-3">
			<div class="rounded-2xl bg-card p-3 shadow-sm">
				<p class="text-xs text-muted-foreground">Durée</p>
				<p class="text-lg font-black">{formatDuration(stats.durationMs)}</p>
				<p class="text-xs text-muted-foreground">{stats.totalTurns} tours joués</p>
			</div>
			<div class="rounded-2xl bg-card p-3 shadow-sm">
				<p class="text-xs text-muted-foreground">Meilleur tour</p>
				<p class="text-lg font-black tabular-nums">
					{stats.bestTurn ? formatScore(stats.bestTurn.score) : '—'}
				</p>
				<p class="text-xs text-muted-foreground">{stats.bestTurn?.player.name ?? '—'}</p>
			</div>
			<div class="rounded-2xl bg-card p-3 shadow-sm">
				<p class="text-xs text-muted-foreground">Score moyen / tour</p>
				<p class="text-lg font-black tabular-nums">
					{formatScore(
						Math.round(
							Object.values(stats.averagePerPlayer).reduce((a, b) => a + b, 0) /
								Math.max(Object.keys(stats.averagePerPlayer).length, 1)
						)
					)}
				</p>
				<p class="text-xs text-muted-foreground">tous joueurs</p>
			</div>
			<div class="rounded-2xl bg-card p-3 shadow-sm">
				<p class="text-xs text-muted-foreground">Total de croix</p>
				<p class="text-lg font-black tabular-nums">
					{Object.values(stats.crossesPerPlayer).reduce((a, b) => a + b, 0)}
				</p>
				<p class="truncate text-xs text-muted-foreground">
					{game.states[game.currentIndex].players
						.map((p) => `${p.name} ${stats.crossesPerPlayer[p.id] ?? 0}`)
						.join(' · ')}
				</p>
			</div>
			<div class="rounded-2xl bg-card p-3 shadow-sm">
				<p class="text-xs text-muted-foreground">Plus grosse infortune</p>
				<p class="text-lg font-black tabular-nums">
					{stats.biggestSetback ? `-${formatScore(stats.biggestSetback.amount)}` : '—'}
				</p>
				<p class="text-xs text-muted-foreground">
					{stats.biggestSetback?.player.name ?? 'personne'}
				</p>
			</div>
			<div class="rounded-2xl bg-card p-3 shadow-sm">
				<p class="text-xs text-muted-foreground">Retournements</p>
				<p class="text-lg font-black tabular-nums">{stats.leadChanges}</p>
				<p class="text-xs text-muted-foreground">changements de leader</p>
			</div>
		</div>
	</div>

	<div class="flex gap-3">
		<Button variant="dark" class="flex-1" onclick={onRestart}>Rejouer</Button>
		<Button variant="secondary" class="flex-1" onclick={onHome}>Accueil</Button>
	</div>

	<button
		type="button"
		class="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
		onclick={onShowTable}
	>
		Voir le tableau des scores →
	</button>
</div>

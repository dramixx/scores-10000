<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import ConfirmDialog from '$lib/components/game/confirm-dialog.svelte';
	import RulesDialog from '$lib/components/game/rules-dialog.svelte';
	import ScoreTable from '$lib/components/game/score-table.svelte';
	import ScoreEntryPanel from '$lib/components/game/score-entry-panel.svelte';
	import VictoryScreen from '$lib/components/game/victory-screen.svelte';
	import { GameStore } from '$lib/game/store.svelte';
	import { activePlayer, computePlayerDerived, restartWithSamePlayers } from '$lib/game/engine';
	import { loadGame, saveGame } from '$lib/game/storage';
	import { InvalidScoreError, InvalidCancelError } from '$lib/game/engine';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import Undo2Icon from '@lucide/svelte/icons/undo-2';
	import Redo2Icon from '@lucide/svelte/icons/redo-2';
	import CircleHelpIcon from '@lucide/svelte/icons/circle-help';

	const gameId = $derived(page.params.id);

	let store = $state<GameStore | null>(null);
	let notFound = $state(false);
	let rulesOpen = $state(false);
	let showTableOnVictory = $state(false);
	let restartConfirmOpen = $state(false);
	let cancelTarget = $state<{ playerId: string; playerName: string; turnId: string } | null>(null);
	let submitError = $state<string | null>(null);

	onMount(() => {
		const game = gameId ? loadGame(gameId) : null;
		if (!game) {
			notFound = true;
			return;
		}
		store = new GameStore(game);
	});

	const gameState = $derived(store?.state);
	const active = $derived(gameState ? activePlayer(gameState) : null);
	const roundNumber = $derived(
		active && gameState ? computePlayerDerived(gameState, active.id).turnsPlayed + 1 : 1
	);

	function handleSubmit(score: number) {
		if (!store || !active) return;
		submitError = null;
		try {
			store.applyScore(active.id, score);
		} catch (e) {
			submitError = e instanceof InvalidScoreError ? e.message : 'Une erreur est survenue.';
		}
	}

	function requestCancel(playerId: string, turnId: string) {
		if (!gameState) return;
		const player = gameState.players.find((p) => p.id === playerId);
		if (!player) return;
		cancelTarget = { playerId, playerName: player.name, turnId };
	}

	function confirmCancel() {
		if (!store || !cancelTarget) return;
		try {
			store.cancelLastValidTurn(cancelTarget.playerId, cancelTarget.turnId);
		} catch (e) {
			submitError = e instanceof InvalidCancelError ? e.message : 'Une erreur est survenue.';
		}
		cancelTarget = null;
	}

	function restartSamePlayers() {
		if (!store?.game) return;
		const fresh = restartWithSamePlayers(store.game);
		saveGame(fresh);
		goto(resolve('/game/[id]', { id: fresh.id }));
	}
</script>

<svelte:head>
	<title>{active ? `${active.name} — 10000` : '10000'}</title>
</svelte:head>

{#if notFound}
	<div class="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
		<p class="text-lg font-bold">Partie introuvable</p>
		<p class="text-sm text-muted-foreground">
			Cette partie n'existe pas ou ses données sont illisibles.
		</p>
		<Button onclick={() => goto(resolve('/'))}>Retour à l'accueil</Button>
	</div>
{:else if gameState && active}
	<div class={gameState.status === 'finished' ? 'flex min-h-svh flex-col' : 'flex h-svh flex-col'}>
		<header class="flex items-center gap-2 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3">
			<button
				type="button"
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary"
				aria-label="Retour à l'accueil"
				onclick={() => goto(resolve('/'))}
			>
				<ArrowLeftIcon class="h-5 w-5" />
			</button>
			<div class="flex-1 text-center">
				<p class="font-extrabold">Manche {roundNumber}</p>
				<p class="text-xs text-muted-foreground">objectif 10 000</p>
			</div>
			<button
				type="button"
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary disabled:opacity-30"
				aria-label="Annuler la dernière action"
				disabled={!store?.canUndo}
				onclick={() => store?.undo()}
			>
				<Undo2Icon class="h-4 w-4" />
			</button>
			<button
				type="button"
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary disabled:opacity-30"
				aria-label="Rétablir l'action annulée"
				disabled={!store?.canRedo}
				onclick={() => store?.redo()}
			>
				<Redo2Icon class="h-4 w-4" />
			</button>
			<button
				type="button"
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary"
				aria-label="Voir les règles"
				onclick={() => (rulesOpen = true)}
			>
				<CircleHelpIcon class="h-4 w-4" />
			</button>
		</header>

		{#if gameState.status === 'finished'}
			{#if store?.game}
				<VictoryScreen
					game={store.game}
					onRestart={() => (restartConfirmOpen = true)}
					onHome={() => goto(resolve('/'))}
					onShowTable={() => (showTableOnVictory = !showTableOnVictory)}
				/>
				{#if showTableOnVictory}
					<div class="px-5 pb-8">
						<ScoreTable state={gameState} onCancelTurn={() => {}} class="max-h-96" />
					</div>
				{/if}
			{/if}
		{:else}
			<div class="min-h-0 flex-1 px-5 pt-2 pb-4">
				<ScoreTable
					state={gameState}
					activePlayerId={active.id}
					onCancelTurn={requestCancel}
					class="h-full"
				/>
			</div>

			<div class="sticky bottom-0">
				<ScoreEntryPanel
					playerName={active.name}
					cumulative={computePlayerDerived(gameState, active.id).cumulative}
					onsubmit={handleSubmit}
				/>
			</div>
		{/if}
	</div>
{/if}

<RulesDialog bind:open={rulesOpen} />

<ConfirmDialog
	bind:open={
		() => cancelTarget !== null,
		(v) => {
			if (!v) cancelTarget = null;
		}
	}
	title="Annuler ce tour ?"
	description={cancelTarget
		? `Le dernier tour valide de ${cancelTarget.playerName} sera annulé et son score reviendra à la valeur précédente.`
		: ''}
	confirmLabel="Annuler le tour"
	variant="destructive"
	onconfirm={confirmCancel}
/>

<ConfirmDialog
	bind:open={restartConfirmOpen}
	title="Rejouer avec les mêmes joueurs ?"
	description="Une nouvelle partie sera créée avec les mêmes joueurs, dans le même ordre, et tous les scores seront remis à zéro."
	confirmLabel="Rejouer"
	onconfirm={restartSamePlayers}
/>

{#if submitError}
	<div class="fixed inset-x-0 bottom-24 z-40 flex justify-center px-5" role="alert">
		<p
			class="rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground shadow-lg"
		>
			{submitError}
		</p>
	</div>
{/if}

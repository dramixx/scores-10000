<script lang="ts">
	import { tick } from 'svelte';
	import { cn } from '$lib/utils';
	import { formatScore } from '$lib/format-time';
	import { computePlayerDerived } from '$lib/game/engine';
	import type { GameState, Turn } from '$lib/game/types';

	let {
		state: gameState,
		activePlayerId,
		onCancelTurn,
		class: className
	}: {
		state: GameState;
		activePlayerId?: string;
		onCancelTurn: (playerId: string, turnId: string) => void;
		class?: string;
	} = $props();

	let scrollEl = $state<HTMLDivElement | null>(null);

	const maxRound = $derived(gameState.turns.reduce((max, t) => Math.max(max, t.roundNumber), 0));

	const rounds = $derived(Array.from({ length: maxRound }, (_, i) => i + 1));

	function turnFor(playerId: string, round: number): Turn | undefined {
		return gameState.turns.find((t) => t.playerId === playerId && t.roundNumber === round);
	}

	const derivedByPlayer = $derived(
		new Map(gameState.players.map((p) => [p.id, computePlayerDerived(gameState, p.id)]))
	);

	const anchorIds = $derived(
		new Map([...derivedByPlayer].map(([id, d]) => [id, d.pendingGroupIds[0]]))
	);

	// Every player tied for the highest (non-zero) score is flagged as leader.
	const leaderIds = $derived.by(() => {
		const best = Math.max(0, ...[...derivedByPlayer.values()].map((d) => d.cumulative));
		if (best <= 0) return new Set<string>();
		return new Set([...derivedByPlayer].filter(([, d]) => d.cumulative === best).map(([id]) => id));
	});

	// After each score: jump to the most recent round, and to the active player's column
	// when there are too many players to fit horizontally.
	$effect(() => {
		void gameState.turns.length;
		const activeId = activePlayerId;
		if (!scrollEl) return;
		const el = scrollEl;
		tick().then(() => {
			el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
			if (activeId) {
				el.querySelector<HTMLElement>(`[data-player-id="${activeId}"]`)?.scrollIntoView({
					behavior: 'smooth',
					inline: 'center',
					block: 'nearest'
				});
			}
		});
	});
</script>

{#if maxRound === 0}
	<p class="py-8 text-center text-sm text-muted-foreground">Aucun tour joué pour le moment.</p>
{:else}
	<div bind:this={scrollEl} class={cn('overflow-auto', className)}>
		<table class="border-separate border-spacing-y-2" style="min-width: 100%;">
			<thead>
				<tr>
					{#each gameState.players as player (player.id)}
						{@const crossStreak = derivedByPlayer.get(player.id)?.crossStreak ?? 0}
						<th
							data-player-id={player.id}
							class="sticky top-0 z-10 w-20 min-w-20 bg-background px-1 pb-1 text-center text-xs font-bold"
						>
							<span
								class={cn(
									'block truncate rounded-xl px-2 py-1.5',
									player.id === activePlayerId
										? 'bg-card-active text-card-active-foreground'
										: 'bg-card text-muted-foreground'
								)}
							>
								{player.name}
							</span>
							{#if crossStreak > 0}
								<span class="mt-0.5 block text-xs whitespace-nowrap text-destructive">
									{crossStreak >= 2 ? `${crossStreak} croix` : '❌'}
								</span>
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rounds as round (round)}
					<tr>
						{#each gameState.players as player (player.id)}
							{@const turn = turnFor(player.id, round)}
							<td class="w-20 min-w-20 px-1 text-center">
								{#if turn}
									{@const isAnchor = !turn.cancelled && anchorIds.get(player.id) === turn.id}
									<button
										type="button"
										class={cn(
											'w-full rounded-xl px-2 py-1.5',
											turn.cancelled
												? 'bg-muted/60'
												: leaderIds.has(player.id)
													? 'bg-gold text-gold-foreground'
													: 'bg-card',
											isAnchor ? 'cursor-pointer' : 'cursor-default'
										)}
										data-leader={leaderIds.has(player.id) ? '' : undefined}
										disabled={!isAnchor}
										onclick={() => isAnchor && onCancelTurn(player.id, turn.id)}
										aria-label={isAnchor ? `Annuler ce tour de ${player.name}` : undefined}
									>
										<span
											class={cn(
												'block text-sm font-black tabular-nums',
												turn.cancelled && 'text-muted-foreground line-through'
											)}
										>
											{formatScore(turn.cumulativeAfter)}
										</span>
										{#if turn.isCross}
											<span class="block text-xs text-destructive">❌</span>
										{:else if turn.scoreEntered > 0}
											<span
												class={cn(
													'block text-xs font-semibold',
													turn.cancelled
														? 'text-muted-foreground'
														: leaderIds.has(player.id)
															? 'text-gold-foreground'
															: 'text-success'
												)}
											>
												+{formatScore(turn.scoreEntered)}
											</span>
										{:else}
											<span class="block text-xs text-muted-foreground">0</span>
										{/if}
									</button>
								{:else}
									<span class="block text-muted-foreground">·</span>
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

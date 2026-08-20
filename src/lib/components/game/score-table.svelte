<script lang="ts">
	import { cn } from '$lib/utils';
	import { formatScore } from '$lib/format-time';
	import { computePlayerDerived } from '$lib/game/engine';
	import type { GameState, Turn } from '$lib/game/types';

	let {
		state,
		onCancelTurn
	}: {
		state: GameState;
		onCancelTurn: (playerId: string, turnId: string) => void;
	} = $props();

	const maxRound = $derived(state.turns.reduce((max, t) => Math.max(max, t.roundNumber), 0));

	const rounds = $derived(Array.from({ length: maxRound }, (_, i) => i + 1));

	function turnFor(playerId: string, round: number): Turn | undefined {
		return state.turns.find((t) => t.playerId === playerId && t.roundNumber === round);
	}

	const anchorIds = $derived(
		new Map(state.players.map((p) => [p.id, computePlayerDerived(state, p.id).pendingGroupIds[0]]))
	);
</script>

{#if maxRound === 0}
	<p class="py-8 text-center text-sm text-muted-foreground">Aucun tour joué pour le moment.</p>
{:else}
	<div class="overflow-x-auto">
		<table class="w-full min-w-full border-separate border-spacing-y-2">
			<thead>
				<tr>
					<th class="w-8 text-left text-xs font-bold text-muted-foreground"></th>
					{#each state.players as player (player.id)}
						<th class="px-1 text-center text-xs font-bold text-muted-foreground">
							<span class="block truncate">{player.name}</span>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rounds as round (round)}
					<tr>
						<td class="px-1 text-xs font-bold text-muted-foreground">{round}</td>
						{#each state.players as player (player.id)}
							{@const turn = turnFor(player.id, round)}
							<td class="px-1 text-center">
								{#if turn}
									{@const isAnchor = !turn.cancelled && anchorIds.get(player.id) === turn.id}
									<button
										type="button"
										class={cn(
											'w-full rounded-xl px-2 py-1.5',
											turn.cancelled ? 'bg-muted/60' : 'bg-card',
											isAnchor ? 'cursor-pointer' : 'cursor-default'
										)}
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
													turn.cancelled ? 'text-muted-foreground' : 'text-success'
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

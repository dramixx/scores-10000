<script lang="ts">
	import { cn } from '$lib/utils';
	import { formatScore } from '$lib/format-time';
	import type { Player, PlayerDerived } from '$lib/game/types';

	let { player, derived, active }: { player: Player; derived: PlayerDerived; active: boolean } =
		$props();
</script>

<div
	data-player-id={player.id}
	class={cn(
		'flex w-20 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-center transition-colors',
		active ? 'bg-card-active text-card-active-foreground' : 'bg-card text-card-foreground'
	)}
>
	<p class="w-full truncate text-xs font-bold">{player.name}</p>
	<p class="text-xl font-black tabular-nums">{formatScore(derived.cumulative)}</p>
	{#if derived.crossStreak > 0}
		<p
			class={cn(
				'text-xs font-bold whitespace-nowrap',
				active ? 'text-red-300' : 'text-destructive'
			)}
		>
			{derived.crossStreak >= 2 ? `${derived.crossStreak} croix` : '❌'}
		</p>
	{/if}
</div>

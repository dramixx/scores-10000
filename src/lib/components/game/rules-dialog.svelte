<script lang="ts">
	import { Dialog } from '$lib/components/ui/dialog';
	import {
		combinations,
		endOfGame,
		gameGoal,
		specialRules,
		turnExample
	} from '$lib/game/rules-content';

	let { open = $bindable(false) }: { open?: boolean } = $props();
</script>

<Dialog bind:open title="Règles" contentClass="sm:max-w-lg">
	<div class="space-y-6">
		<p class="text-sm leading-relaxed text-foreground/90">{gameGoal}</p>

		<section>
			<h3 class="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
				Combinaisons
			</h3>
			<div class="divide-y divide-border overflow-hidden rounded-2xl border border-border">
				{#each combinations as combo (combo.label)}
					<div class="flex items-center justify-between bg-card px-4 py-3 text-sm">
						<span>{combo.label}</span>
						<span class="font-bold text-accent-blue">{combo.points}</span>
					</div>
				{/each}
			</div>
		</section>

		<section>
			<h3 class="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
				Règles spéciales
			</h3>
			<div class="space-y-2">
				{#each specialRules as rule (rule.title)}
					<div class="rounded-2xl border border-border bg-card p-3">
						<p class="text-sm font-bold">{rule.title}</p>
						<p class="mt-1 text-sm text-muted-foreground">{rule.description}</p>
					</div>
				{/each}
			</div>
		</section>

		<section>
			<h3 class="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
				Exemple de tour
			</h3>
			<p class="text-sm text-muted-foreground">{turnExample}</p>
		</section>

		<section>
			<h3 class="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
				Fin de partie
			</h3>
			<p class="text-sm text-muted-foreground">{endOfGame}</p>
		</section>
	</div>
</Dialog>

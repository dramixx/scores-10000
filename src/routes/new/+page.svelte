<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { createGame } from '$lib/game/engine';
	import { saveGame } from '$lib/game/storage';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	const MIN_PLAYERS = 1;
	const MAX_PLAYERS = 12;
	const RECOMMENDED = '2 à 8 recommandé';

	let count = $state(3);
	let names = $state<string[]>(['', '', '']);

	function setCount(next: number) {
		const clamped = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, next));
		if (clamped === count) return;
		if (clamped > count) {
			names = [...names, ...Array.from({ length: clamped - count }, () => '')];
		} else {
			names = names.slice(0, clamped);
		}
		count = clamped;
	}

	function moveUp(index: number) {
		if (index === 0) return;
		const next = [...names];
		[next[index - 1], next[index]] = [next[index], next[index - 1]];
		names = next;
	}

	function moveDown(index: number) {
		if (index === names.length - 1) return;
		const next = [...names];
		[next[index + 1], next[index]] = [next[index], next[index + 1]];
		names = next;
	}

	const trimmedNames = $derived(names.map((n) => n.trim()));
	const allNamesFilled = $derived(trimmedNames.every((n) => n.length > 0));

	function startGame() {
		if (!allNamesFilled) return;
		const game = createGame(trimmedNames);
		saveGame(game);
		goto(resolve('/game/[id]', { id: game.id }));
	}
</script>

<svelte:head>
	<title>Nouvelle partie — 10000</title>
</svelte:head>

<div class="flex min-h-svh flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-8">
	<header class="mb-6 flex items-center gap-3">
		<button
			type="button"
			class="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary"
			aria-label="Retour"
			onclick={() => goto(resolve('/'))}
		>
			<ArrowLeftIcon class="h-5 w-5" />
		</button>
		<h1 class="text-2xl font-extrabold">Nouvelle partie</h1>
	</header>

	<div class="mb-6 flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm">
		<div>
			<p class="font-bold">Joueurs</p>
			<p class="text-xs text-muted-foreground">{RECOMMENDED}</p>
		</div>
		<div class="flex items-center gap-3">
			<button
				type="button"
				class="flex h-9 w-9 items-center justify-center rounded-full bg-secondary disabled:opacity-40"
				aria-label="Retirer un joueur"
				disabled={count <= MIN_PLAYERS}
				onclick={() => setCount(count - 1)}
			>
				<MinusIcon class="h-4 w-4" />
			</button>
			<span class="w-6 text-center text-xl font-black">{count}</span>
			<button
				type="button"
				class="flex h-9 w-9 items-center justify-center rounded-full bg-secondary disabled:opacity-40"
				aria-label="Ajouter un joueur"
				disabled={count >= MAX_PLAYERS}
				onclick={() => setCount(count + 1)}
			>
				<PlusIcon class="h-4 w-4" />
			</button>
		</div>
	</div>

	<h2 class="mb-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">
		Ordre de passage
	</h2>
	<ul class="space-y-3">
		{#each names as _name, index (index)}
			<li class="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm">
				<span
					class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold"
				>
					{index + 1}
				</span>
				<Input
					bind:value={names[index]}
					placeholder="Nom du joueur"
					maxlength={24}
					aria-label={`Nom du joueur ${index + 1}`}
					class="h-11 flex-1 border-none bg-transparent px-1 shadow-none focus-visible:ring-0"
				/>
				<div class="flex shrink-0 flex-col">
					<button
						type="button"
						class="flex h-6 w-6 items-center justify-center text-muted-foreground disabled:opacity-30"
						aria-label="Monter"
						disabled={index === 0}
						onclick={() => moveUp(index)}
					>
						<ChevronUpIcon class="h-4 w-4" />
					</button>
					<button
						type="button"
						class="flex h-6 w-6 items-center justify-center text-muted-foreground disabled:opacity-30"
						aria-label="Descendre"
						disabled={index === names.length - 1}
						onclick={() => moveDown(index)}
					>
						<ChevronDownIcon class="h-4 w-4" />
					</button>
				</div>
			</li>
		{/each}
	</ul>

	<div class="mt-auto pt-8">
		<Button size="lg" class="w-full" disabled={!allNamesFilled} onclick={startGame}>
			Commencer la partie
		</Button>
	</div>
</div>

import {
	CROSSES_TO_CANCEL,
	MAX_TURN_SCORE,
	WINNING_SCORE,
	type Game,
	type GameState,
	type Player,
	type PlayerDerived,
	type Turn
} from './types';

function genId(): string {
	return crypto.randomUUID();
}

function now(): number {
	return Date.now();
}

/** Deep-clones a state snapshot so past history entries are never mutated. */
function cloneState(state: GameState): GameState {
	return {
		...state,
		players: state.players.map((p) => ({ ...p })),
		order: [...state.order],
		turns: state.turns.map((t) => ({ ...t }))
	};
}

export function createGame(playerNames: string[]): Game {
	const players: Player[] = playerNames.map((name) => ({ id: genId(), name: name.trim() }));
	const timestamp = now();
	const state: GameState = {
		players,
		order: players.map((p) => p.id),
		activePlayerIndex: 0,
		status: 'in_progress',
		winnerId: null,
		turns: [],
		createdAt: timestamp,
		updatedAt: timestamp
	};
	return {
		id: genId(),
		states: [state],
		currentIndex: 0,
		createdAt: timestamp,
		updatedAt: timestamp
	};
}

export function currentState(game: Game): GameState {
	return game.states[game.currentIndex];
}

export function activePlayer(state: GameState): Player {
	const id = state.order[state.activePlayerIndex];
	const player = state.players.find((p) => p.id === id);
	if (!player) throw new Error('Active player not found');
	return player;
}

/**
 * Computes a player's effective cumulative score, current cross streak, and the
 * group of turns that would be wiped together if a 3rd cross (or manual cancel) hits.
 * Purely derived from the turn log, so cancellations never need separate bookkeeping.
 */
export function computePlayerDerived(state: GameState, playerId: string): PlayerDerived {
	let cumulative = 0;
	let crossStreak = 0;
	let pendingGroupIds: string[] = [];
	let turnsPlayed = 0;

	for (const turn of state.turns) {
		if (turn.playerId !== playerId) continue;
		turnsPlayed += 1;
		if (turn.cancelled) continue;

		if (turn.scoreEntered > 0) {
			cumulative = turn.cumulativeAfter;
			crossStreak = 0;
			pendingGroupIds = [turn.id];
		} else if (cumulative > 0) {
			crossStreak += 1;
			pendingGroupIds = [...pendingGroupIds, turn.id];
		}
		// else: score is 0 and cumulative is still 0 — a no-op turn, ignored.
	}

	return { playerId, cumulative, crossStreak, pendingGroupIds, turnsPlayed };
}

function nextRoundNumber(state: GameState, playerId: string): number {
	return state.turns.filter((t) => t.playerId === playerId).length + 1;
}

export class InvalidScoreError extends Error {}

/** Applies a score (or a cross, via 0) for the current active player. Returns a new Game. */
export function applyScore(game: Game, playerId: string, rawScore: number): Game {
	const state = currentState(game);
	if (state.status !== 'in_progress') {
		throw new InvalidScoreError('La partie est terminée.');
	}
	const active = activePlayer(state);
	if (active.id !== playerId) {
		throw new InvalidScoreError("Ce n'est pas le tour de ce joueur.");
	}
	if (!Number.isInteger(rawScore) || rawScore < 0) {
		throw new InvalidScoreError('Le score doit être un entier positif.');
	}
	if (rawScore > MAX_TURN_SCORE) {
		throw new InvalidScoreError(`Le score ne peut pas dépasser ${MAX_TURN_SCORE}.`);
	}

	const next = cloneState(state);
	const before = computePlayerDerived(state, playerId);
	const isCross = rawScore === 0 && before.cumulative > 0;
	const newCumulative = before.cumulative + rawScore;
	const timestamp = now();

	const turn: Turn = {
		id: genId(),
		playerId,
		roundNumber: nextRoundNumber(state, playerId),
		scoreEntered: rawScore,
		cumulativeAfter: newCumulative,
		isCross,
		cancelled: false,
		createdAt: timestamp
	};
	next.turns.push(turn);

	// Three consecutive crosses wipe the anchor valid turn and every cross since.
	const after = computePlayerDerived(next, playerId);
	let effectiveCumulative = newCumulative;
	if (isCross && after.crossStreak >= CROSSES_TO_CANCEL) {
		for (const id of after.pendingGroupIds) {
			const t = next.turns.find((t) => t.id === id);
			if (t) {
				t.cancelled = true;
				t.cancelledReason = 'three-crosses';
			}
		}
		effectiveCumulative = computePlayerDerived(next, playerId).cumulative;
	}

	// Landing exactly on an opponent's score strikes out that opponent's last valid turn.
	if (effectiveCumulative > 0) {
		for (const opponent of next.players) {
			if (opponent.id === playerId) continue;
			const opponentDerived = computePlayerDerived(next, opponent.id);
			if (opponentDerived.cumulative > 0 && opponentDerived.cumulative === effectiveCumulative) {
				for (const id of opponentDerived.pendingGroupIds) {
					const t = next.turns.find((t) => t.id === id);
					if (t) {
						t.cancelled = true;
						t.cancelledReason = 'score-collision';
					}
				}
			}
		}
	}

	if (effectiveCumulative >= WINNING_SCORE) {
		next.status = 'finished';
		next.winnerId = playerId;
	} else {
		next.activePlayerIndex = (state.activePlayerIndex + 1) % state.order.length;
	}
	next.updatedAt = timestamp;

	return pushState(game, next);
}

export class InvalidCancelError extends Error {}

/** Manually cancels a player's last valid (positive) turn, along with its pending cross group. */
export function cancelLastValidTurn(game: Game, playerId: string, turnId: string): Game {
	const state = currentState(game);
	if (state.status !== 'in_progress') {
		throw new InvalidCancelError('La partie est terminée.');
	}
	const derived = computePlayerDerived(state, playerId);
	const anchorId = derived.pendingGroupIds[0];
	const targetTurn = state.turns.find((t) => t.id === turnId);
	if (!targetTurn || targetTurn.cancelled) {
		throw new InvalidCancelError('Ce tour a déjà été annulé.');
	}
	if (targetTurn.scoreEntered === 0) {
		throw new InvalidCancelError('Une croix ne peut pas être annulée de cette façon.');
	}
	if (!anchorId || anchorId !== turnId) {
		throw new InvalidCancelError("Seul le dernier tour valide d'un joueur peut être annulé.");
	}

	const next = cloneState(state);
	for (const id of derived.pendingGroupIds) {
		const t = next.turns.find((t) => t.id === id);
		if (t) {
			t.cancelled = true;
			t.cancelledReason = 'manual';
		}
	}
	next.updatedAt = now();
	return pushState(game, next);
}

function pushState(game: Game, state: GameState): Game {
	const states = [...game.states.slice(0, game.currentIndex + 1), state];
	return {
		...game,
		states,
		currentIndex: states.length - 1,
		updatedAt: state.updatedAt
	};
}

export function canUndo(game: Game): boolean {
	return game.currentIndex > 0;
}

export function canRedo(game: Game): boolean {
	return game.currentIndex < game.states.length - 1;
}

export function undo(game: Game): Game {
	if (!canUndo(game)) return game;
	return { ...game, currentIndex: game.currentIndex - 1, updatedAt: now() };
}

export function redo(game: Game): Game {
	if (!canRedo(game)) return game;
	return { ...game, currentIndex: game.currentIndex + 1, updatedAt: now() };
}

export function restartWithSamePlayers(game: Game): Game {
	const state = currentState(game);
	return createGame(state.players.map((p) => p.name));
}

export interface GameStats {
	ranking: { player: Player; score: number }[];
	winMargin: number;
	durationMs: number;
	totalTurns: number;
	turnsPerPlayer: Record<string, number>;
	bestTurn: { player: Player; score: number } | null;
	averagePerPlayer: Record<string, number>;
	crossesPerPlayer: Record<string, number>;
	biggestSetback: { player: Player; amount: number } | null;
	leadChanges: number;
}

export function computeStats(game: Game): GameStats {
	const state = currentState(game);
	const scores = state.players.map((player) => ({
		player,
		score: computePlayerDerived(state, player.id).cumulative
	}));
	const ranking = [...scores].sort((a, b) => b.score - a.score);
	const winMargin =
		ranking.length > 1 ? ranking[0].score - ranking[1].score : (ranking[0]?.score ?? 0);

	const validTurns = state.turns.filter((t) => !t.cancelled);
	const totalTurns = state.turns.length;

	const turnsPerPlayer: Record<string, number> = {};
	const crossesPerPlayer: Record<string, number> = {};
	const sumPerPlayer: Record<string, number> = {};
	const countValidScoringPerPlayer: Record<string, number> = {};
	for (const player of state.players) {
		turnsPerPlayer[player.id] = state.turns.filter((t) => t.playerId === player.id).length;
		crossesPerPlayer[player.id] = state.turns.filter(
			(t) => t.playerId === player.id && t.isCross
		).length;
		sumPerPlayer[player.id] = 0;
		countValidScoringPerPlayer[player.id] = 0;
	}
	for (const turn of validTurns) {
		if (turn.scoreEntered > 0) {
			sumPerPlayer[turn.playerId] += turn.scoreEntered;
			countValidScoringPerPlayer[turn.playerId] += 1;
		}
	}
	const averagePerPlayer: Record<string, number> = {};
	for (const player of state.players) {
		const count = countValidScoringPerPlayer[player.id];
		averagePerPlayer[player.id] = count > 0 ? Math.round(sumPerPlayer[player.id] / count) : 0;
	}

	let bestTurn: { player: Player; score: number } | null = null;
	for (const turn of validTurns) {
		if (turn.scoreEntered <= 0) continue;
		if (!bestTurn || turn.scoreEntered > bestTurn.score) {
			const player = state.players.find((p) => p.id === turn.playerId);
			if (player) bestTurn = { player, score: turn.scoreEntered };
		}
	}

	// Biggest setback: largest drop caused by a cancellation group (three-crosses or score-collision).
	// We replay each player's own turns in order, tracking the last valid (non-cancelled) cumulative
	// score; a cancelled anchor turn (scoreEntered > 0, wiped by three-crosses/score-collision) still
	// carries the cumulative value it would have reached, so the drop is that value minus the
	// cumulative score the player actually had going into that turn.
	let biggestSetback: { player: Player; amount: number } | null = null;
	for (const player of state.players) {
		const playerTurns = state.turns.filter((t) => t.playerId === player.id);
		let cumulative = 0;
		for (const turn of playerTurns) {
			if (turn.cancelled) {
				if (
					turn.scoreEntered > 0 &&
					(turn.cancelledReason === 'three-crosses' || turn.cancelledReason === 'score-collision')
				) {
					const amount = turn.cumulativeAfter - cumulative;
					if (amount > 0 && (!biggestSetback || amount > biggestSetback.amount)) {
						biggestSetback = { player, amount };
					}
				}
				continue;
			}
			if (turn.scoreEntered > 0) {
				cumulative = turn.cumulativeAfter;
			}
		}
	}

	// Lead changes: replay turns chronologically and track when the top-ranked player changes.
	let leadChanges = 0;
	{
		const cumBy: Record<string, number> = {};
		for (const p of state.players) cumBy[p.id] = 0;
		let currentLeader: string | null = null;
		for (const turn of state.turns) {
			if (turn.cancelled) continue;
			cumBy[turn.playerId] = turn.cumulativeAfter;
			let topId: string | null = null;
			let topScore = -1;
			for (const p of state.players) {
				if (cumBy[p.id] > topScore) {
					topScore = cumBy[p.id];
					topId = p.id;
				}
			}
			if (topScore > 0 && topId && topId !== currentLeader) {
				if (currentLeader !== null) leadChanges += 1;
				currentLeader = topId;
			}
		}
	}

	const timestamps = state.turns.map((t) => t.createdAt);
	const durationMs = timestamps.length > 0 ? Math.max(...timestamps) - Math.min(...timestamps) : 0;

	return {
		ranking,
		winMargin,
		durationMs,
		totalTurns,
		turnsPerPlayer,
		bestTurn,
		averagePerPlayer,
		crossesPerPlayer,
		biggestSetback,
		leadChanges
	};
}

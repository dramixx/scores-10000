import { describe, expect, it } from 'vitest';
import {
	InvalidCancelError,
	InvalidScoreError,
	applyScore,
	cancelLastValidTurn,
	canRedo,
	canUndo,
	computePlayerDerived,
	computeStats,
	createGame,
	currentState,
	redo,
	restartWithSamePlayers,
	undo
} from './engine';

function ids(game: ReturnType<typeof createGame>) {
	return currentState(game).players.map((p) => p.id);
}

describe('createGame', () => {
	it('creates players in order, active player is first, in progress', () => {
		const game = createGame(['Léa', 'Marc', 'Sofia']);
		const state = currentState(game);
		expect(state.players.map((p) => p.name)).toEqual(['Léa', 'Marc', 'Sofia']);
		expect(state.order).toEqual(ids(game));
		expect(state.activePlayerIndex).toBe(0);
		expect(state.status).toBe('in_progress');
		expect(state.turns).toEqual([]);
	});
});

describe('applyScore basics', () => {
	it('rejects a score above 10000', () => {
		const game = createGame(['A', 'B']);
		const [a] = ids(game);
		expect(() => applyScore(game, a, 10001)).toThrow(InvalidScoreError);
	});

	it('rejects a negative or non-integer score', () => {
		const game = createGame(['A', 'B']);
		const [a] = ids(game);
		expect(() => applyScore(game, a, -1)).toThrow(InvalidScoreError);
		expect(() => applyScore(game, a, 1.5)).toThrow(InvalidScoreError);
	});

	it('rejects a score for a player who is not active', () => {
		const game = createGame(['A', 'B']);
		const [, b] = ids(game);
		expect(() => applyScore(game, b, 500)).toThrow(InvalidScoreError);
	});

	it('accumulates score and rotates the active player', () => {
		let game = createGame(['A', 'B']);
		const [a, b] = ids(game);
		game = applyScore(game, a, 500);
		let state = currentState(game);
		expect(computePlayerDerived(state, a).cumulative).toBe(500);
		expect(state.activePlayerIndex).toBe(1);

		game = applyScore(game, b, 300);
		state = currentState(game);
		expect(computePlayerDerived(state, b).cumulative).toBe(300);
		expect(state.activePlayerIndex).toBe(0);

		game = applyScore(game, a, 200);
		state = currentState(game);
		expect(computePlayerDerived(state, a).cumulative).toBe(700);
	});

	it('wraps rotation back to the first player cyclically', () => {
		let game = createGame(['A', 'B', 'C']);
		const [a, b, c] = ids(game);
		game = applyScore(game, a, 100);
		game = applyScore(game, b, 100);
		game = applyScore(game, c, 100);
		expect(currentState(game).activePlayerIndex).toBe(0);
	});
});

describe('crosses', () => {
	it('a 0 score while cumulative is still 0 is not a cross', () => {
		let game = createGame(['A', 'B']);
		const [a] = ids(game);
		game = applyScore(game, a, 0);
		const state = currentState(game);
		const derived = computePlayerDerived(state, a);
		expect(derived.cumulative).toBe(0);
		expect(derived.crossStreak).toBe(0);
		expect(state.turns[0].isCross).toBe(false);
	});

	it('a 0 score after scoring increments the cross streak', () => {
		let game = createGame(['A', 'B']);
		const [a, b] = ids(game);
		game = applyScore(game, a, 500);
		game = applyScore(game, b, 100);
		game = applyScore(game, a, 0);
		const state = currentState(game);
		expect(state.turns.at(-1)?.isCross).toBe(true);
		expect(computePlayerDerived(state, a).crossStreak).toBe(1);
		expect(computePlayerDerived(state, a).cumulative).toBe(500);
	});

	it('three consecutive crosses wipe the last valid turn, reverting to the prior valid score', () => {
		let game = createGame(['A', 'B']);
		const [a, b] = ids(game);
		game = applyScore(game, a, 300); // valid anchor -> 300
		game = applyScore(game, b, 100);
		game = applyScore(game, a, 500); // new anchor -> 800
		game = applyScore(game, b, 100);
		game = applyScore(game, a, 0); // cross 1
		game = applyScore(game, b, 100);
		game = applyScore(game, a, 0); // cross 2
		game = applyScore(game, b, 100);
		game = applyScore(game, a, 0); // cross 3 -> wipes the 800 anchor entirely
		const state = currentState(game);
		const derived = computePlayerDerived(state, a);
		expect(derived.cumulative).toBe(300);
		expect(derived.crossStreak).toBe(0);
		const aTurns = state.turns.filter((t) => t.playerId === a);
		// the anchor turn (500 -> cumulative 800) and both prior crosses plus the triggering cross
		// are all cancelled
		expect(aTurns.filter((t) => t.cancelled)).toHaveLength(4);
		expect(aTurns.filter((t) => t.cancelledReason === 'three-crosses')).toHaveLength(4);
	});

	it('scoring again resets the cross streak on a fresh anchor', () => {
		let game = createGame(['A', 'B']);
		const [a, b] = ids(game);
		game = applyScore(game, a, 300);
		game = applyScore(game, b, 100);
		game = applyScore(game, a, 0);
		game = applyScore(game, b, 100);
		game = applyScore(game, a, 200); // valid turn resets the streak
		const state = currentState(game);
		expect(computePlayerDerived(state, a).crossStreak).toBe(0);
		expect(computePlayerDerived(state, a).cumulative).toBe(500);
	});
});

describe('score collisions', () => {
	it('landing exactly on an opponent score strikes out that opponent last valid turn', () => {
		let game = createGame(['A', 'B']);
		const [a, b] = ids(game);
		game = applyScore(game, a, 500);
		game = applyScore(game, b, 300);
		game = applyScore(game, a, 0); // A stays at 500, active -> B
		game = applyScore(game, b, 200); // B: 300 -> 500, collides with A's 500
		const state = currentState(game);
		expect(computePlayerDerived(state, b).cumulative).toBe(500);
		// A's 500 anchor turn should have been cancelled, reverting A to 0
		expect(computePlayerDerived(state, a).cumulative).toBe(0);
		const aTurns = state.turns.filter((t) => t.playerId === a);
		expect(aTurns.some((t) => t.cancelledReason === 'score-collision')).toBe(true);
	});

	it('does not trigger a collision against a score of 0', () => {
		let game = createGame(['A', 'B']);
		const [a, b] = ids(game);
		game = applyScore(game, a, 0); // still 0, no cross
		game = applyScore(game, b, 0); // also 0 — should NOT cancel anything
		const state = currentState(game);
		expect(computePlayerDerived(state, a).cumulative).toBe(0);
		expect(computePlayerDerived(state, b).cumulative).toBe(0);
		expect(state.turns.every((t) => !t.cancelled)).toBe(true);
	});

	it('checks collisions independently against every opponent', () => {
		let game = createGame(['A', 'B', 'C']);
		const [a, b, c] = ids(game);
		game = applyScore(game, a, 400);
		game = applyScore(game, b, 400);
		game = applyScore(game, c, 200);
		game = applyScore(game, a, 0);
		game = applyScore(game, b, 0);
		game = applyScore(game, c, 200); // C: 200 -> 400, collides with both A and B
		const state = currentState(game);
		expect(computePlayerDerived(state, c).cumulative).toBe(400);
		expect(computePlayerDerived(state, a).cumulative).toBe(0);
		expect(computePlayerDerived(state, b).cumulative).toBe(0);
	});
});

describe('winning', () => {
	it('declares a winner once a player reaches 10000 and freezes the game', () => {
		let game = createGame(['A', 'B']);
		const [a] = ids(game);
		game = applyScore(game, a, 10000);
		const state = currentState(game);
		expect(state.status).toBe('finished');
		expect(state.winnerId).toBe(a);
		expect(() => applyScore(game, ids(game)[1], 100)).toThrow(InvalidScoreError);
	});

	it('allows overshooting past 10000', () => {
		let game = createGame(['A', 'B']);
		const [a] = ids(game);
		game = applyScore(game, a, 9800);
		game = applyScore(game, ids(game)[1], 100);
		game = applyScore(game, a, 500);
		const state = currentState(game);
		expect(state.status).toBe('finished');
		expect(computePlayerDerived(state, a).cumulative).toBe(10300);
	});

	it('undoing the winning move resumes the game', () => {
		let game = createGame(['A', 'B']);
		const [a] = ids(game);
		game = applyScore(game, a, 10000);
		expect(currentState(game).status).toBe('finished');
		game = undo(game);
		expect(currentState(game).status).toBe('in_progress');
	});
});

describe('manual cancel', () => {
	it('cancels the last valid turn and its pending crosses, reverting to the prior score', () => {
		let game = createGame(['A', 'B']);
		const [a, b] = ids(game);
		game = applyScore(game, a, 300);
		game = applyScore(game, b, 100);
		game = applyScore(game, a, 500); // anchor turn -> 800
		const lastTurn = currentState(game)
			.turns.filter((t) => t.playerId === a)
			.at(-1)!;
		game = cancelLastValidTurn(game, a, lastTurn.id);
		const state = currentState(game);
		expect(computePlayerDerived(state, a).cumulative).toBe(300);
	});

	it('cannot cancel a cross (0 score)', () => {
		let game = createGame(['A', 'B']);
		const [a, b] = ids(game);
		game = applyScore(game, a, 300);
		game = applyScore(game, b, 100);
		game = applyScore(game, a, 0);
		const crossTurn = currentState(game)
			.turns.filter((t) => t.playerId === a)
			.at(-1)!;
		expect(() => cancelLastValidTurn(game, a, crossTurn.id)).toThrow(InvalidCancelError);
	});

	it('cannot cancel a turn that is no longer the most recent valid turn', () => {
		let game = createGame(['A', 'B']);
		const [a, b] = ids(game);
		game = applyScore(game, a, 300);
		const firstTurn = currentState(game).turns[0];
		game = applyScore(game, b, 100);
		game = applyScore(game, a, 200);
		expect(() => cancelLastValidTurn(game, a, firstTurn.id)).toThrow(InvalidCancelError);
	});

	it('cannot cancel an already-cancelled turn', () => {
		let game = createGame(['A', 'B']);
		const [a, b] = ids(game);
		game = applyScore(game, a, 300);
		const turn = currentState(game).turns[0];
		game = applyScore(game, b, 100);
		game = cancelLastValidTurn(game, a, turn.id);
		expect(() => cancelLastValidTurn(game, a, turn.id)).toThrow(InvalidCancelError);
	});
});

describe('undo / redo', () => {
	it('undo reverts to the previous snapshot, redo restores it', () => {
		let game = createGame(['A', 'B']);
		const [a] = ids(game);
		expect(canUndo(game)).toBe(false);
		game = applyScore(game, a, 500);
		expect(canUndo(game)).toBe(true);
		expect(canRedo(game)).toBe(false);
		game = undo(game);
		expect(computePlayerDerived(currentState(game), a).cumulative).toBe(0);
		expect(canRedo(game)).toBe(true);
		game = redo(game);
		expect(computePlayerDerived(currentState(game), a).cumulative).toBe(500);
	});

	it('a new action after undo discards the redo branch', () => {
		let game = createGame(['A', 'B']);
		const [a, b] = ids(game);
		game = applyScore(game, a, 500);
		game = applyScore(game, b, 100);
		game = undo(game);
		game = applyScore(game, b, 999);
		expect(canRedo(game)).toBe(false);
		expect(computePlayerDerived(currentState(game), b).cumulative).toBe(999);
	});
});

describe('restartWithSamePlayers', () => {
	it('creates a fresh game with the same players and order, scores reset', () => {
		let game = createGame(['Léa', 'Marc']);
		const [a] = ids(game);
		game = applyScore(game, a, 500);
		const fresh = restartWithSamePlayers(game);
		expect(fresh.id).not.toBe(game.id);
		const state = currentState(fresh);
		expect(state.players.map((p) => p.name)).toEqual(['Léa', 'Marc']);
		expect(state.turns).toEqual([]);
	});
});

describe('computeStats', () => {
	it('computes ranking, margin, best turn and crosses', () => {
		let game = createGame(['A', 'B']);
		const [a, b] = ids(game);
		game = applyScore(game, a, 500);
		game = applyScore(game, b, 300);
		game = applyScore(game, a, 0); // cross for A
		game = applyScore(game, b, 9700); // B wins at 10000
		const stats = computeStats(game);
		expect(stats.ranking[0].player.id).toBe(b);
		expect(stats.ranking[0].score).toBe(10000);
		expect(stats.winMargin).toBe(9500);
		expect(stats.bestTurn?.score).toBe(9700);
		expect(stats.crossesPerPlayer[a]).toBe(1);
	});

	it('reports the biggest setback amount from a three-crosses wipe', () => {
		let game = createGame(['A', 'B']);
		const [a, b] = ids(game);
		game = applyScore(game, a, 300);
		game = applyScore(game, b, 100);
		game = applyScore(game, a, 500); // -> 800
		game = applyScore(game, b, 100);
		game = applyScore(game, a, 0);
		game = applyScore(game, b, 100);
		game = applyScore(game, a, 0);
		game = applyScore(game, b, 100);
		game = applyScore(game, a, 0); // wipes 800 -> back to 300, drop of 500
		const stats = computeStats(game);
		expect(stats.biggestSetback?.player.id).toBe(a);
		expect(stats.biggestSetback?.amount).toBe(500);
	});
});

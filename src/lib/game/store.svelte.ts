import {
	applyScore as engineApplyScore,
	cancelLastValidTurn as engineCancelLastValidTurn,
	canRedo as engineCanRedo,
	canUndo as engineCanUndo,
	currentState,
	redo as engineRedo,
	undo as engineUndo
} from './engine';
import { saveGame } from './storage';
import type { Game } from './types';

/** Reactive wrapper around a Game, persisting to localStorage after every mutation. */
export class GameStore {
	game = $state<Game>();

	constructor(initial: Game) {
		this.game = initial;
		saveGame(initial);
	}

	get state() {
		if (!this.game) throw new Error('Game not loaded');
		return currentState(this.game);
	}

	get canUndo() {
		return this.game ? engineCanUndo(this.game) : false;
	}

	get canRedo() {
		return this.game ? engineCanRedo(this.game) : false;
	}

	private commit(next: Game) {
		this.game = next;
		saveGame(next);
	}

	applyScore(playerId: string, rawScore: number) {
		if (!this.game) return;
		this.commit(engineApplyScore(this.game, playerId, rawScore));
	}

	cancelLastValidTurn(playerId: string, turnId: string) {
		if (!this.game) return;
		this.commit(engineCancelLastValidTurn(this.game, playerId, turnId));
	}

	undo() {
		if (!this.game) return;
		this.commit(engineUndo(this.game));
	}

	redo() {
		if (!this.game) return;
		this.commit(engineRedo(this.game));
	}
}

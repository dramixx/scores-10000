export const WINNING_SCORE = 10000;
export const MAX_TURN_SCORE = 10000;
export const CROSSES_TO_CANCEL = 3;

export interface Player {
	id: string;
	name: string;
}

export interface Turn {
	id: string;
	playerId: string;
	/** Round index for this player: 1 = their first turn, 2 = their second, etc. */
	roundNumber: number;
	/** Raw points entered by the user for this turn (0 for a cross). */
	scoreEntered: number;
	/** Player's cumulative score if this turn is not cancelled. */
	cumulativeAfter: number;
	/** True if this turn is a "cross" (0 points while the player had already scored). */
	isCross: boolean;
	/** True once this turn has been struck out (3 crosses, score collision, or manual cancel). */
	cancelled: boolean;
	/** Reason the turn was cancelled, for display/debugging. */
	cancelledReason?: 'three-crosses' | 'score-collision' | 'manual';
	createdAt: number;
}

export type GameStatus = 'in_progress' | 'finished';

export interface GameState {
	players: Player[];
	/** Player ids, in turn order. */
	order: string[];
	activePlayerIndex: number;
	status: GameStatus;
	winnerId: string | null;
	turns: Turn[];
	createdAt: number;
	updatedAt: number;
}

export interface Game {
	id: string;
	/** Full snapshot history for undo/redo. */
	states: GameState[];
	/** Index of the currently active snapshot in `states`. */
	currentIndex: number;
	createdAt: number;
	updatedAt: number;
}

export interface PlayerDerived {
	playerId: string;
	/** Effective cumulative score (ignoring cancelled turns). */
	cumulative: number;
	/** Consecutive crosses since the last valid (scoring) turn. */
	crossStreak: number;
	/** Ids of the turns that would be wiped together (anchor valid turn + pending crosses). */
	pendingGroupIds: string[];
	turnsPlayed: number;
}

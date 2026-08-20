import type { Game } from './types';
import { computePlayerDerived, currentState } from './engine';

const STORAGE_PREFIX = 'tenk:game:';
const INDEX_KEY = 'tenk:games-index';

/** Typical per-origin localStorage quota in most browsers. Used only to estimate usage,
 *  since there is no standard API to read the real quota. */
const ASSUMED_QUOTA_BYTES = 5 * 1024 * 1024;
/** Usage ratio (0..1) above which the UI should warn the user to free up space. */
export const STORAGE_WARNING_RATIO = 0.8;

function isBrowser(): boolean {
	return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readIndex(): string[] {
	if (!isBrowser()) return [];
	try {
		const raw = window.localStorage.getItem(INDEX_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
	} catch {
		return [];
	}
}

function writeIndex(ids: string[]): void {
	if (!isBrowser()) return;
	window.localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

export function saveGame(game: Game): void {
	if (!isBrowser()) return;
	window.localStorage.setItem(`${STORAGE_PREFIX}${game.id}`, JSON.stringify(game));
	const ids = readIndex();
	if (!ids.includes(game.id)) {
		writeIndex([game.id, ...ids]);
	}
}

export function isValidGame(value: unknown): value is Game {
	if (!value || typeof value !== 'object') return false;
	const g = value as Partial<Game>;
	if (typeof g.id !== 'string') return false;
	if (!Array.isArray(g.states) || g.states.length === 0) return false;
	if (
		typeof g.currentIndex !== 'number' ||
		g.currentIndex < 0 ||
		g.currentIndex >= g.states.length
	) {
		return false;
	}
	for (const state of g.states) {
		if (!state || typeof state !== 'object') return false;
		if (!Array.isArray(state.players) || state.players.length === 0) return false;
		if (!Array.isArray(state.order) || !Array.isArray(state.turns)) return false;
		if (state.status !== 'in_progress' && state.status !== 'finished') return false;
	}
	return true;
}

export interface GameSummary {
	id: string;
	valid: boolean;
	playerNames: string[];
	updatedAt: number;
	status: 'in_progress' | 'finished';
	winnerName?: string;
	winnerScore?: number;
}

export function loadGame(id: string): Game | null {
	if (!isBrowser()) return null;
	const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${id}`);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		return isValidGame(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

/** Lists all games (in-progress and finished), most recently updated first. Corrupt entries are included as invalid. */
export function listGames(): GameSummary[] {
	if (!isBrowser()) return [];
	const ids = readIndex();
	const summaries: GameSummary[] = [];
	for (const id of ids) {
		const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${id}`);
		if (!raw) continue;
		try {
			const parsed = JSON.parse(raw);
			if (!isValidGame(parsed)) {
				summaries.push({ id, valid: false, playerNames: [], updatedAt: 0, status: 'in_progress' });
				continue;
			}
			const state = currentState(parsed);
			let winnerName: string | undefined;
			let winnerScore: number | undefined;
			if (state.status === 'finished' && state.winnerId) {
				const winner = state.players.find((p) => p.id === state.winnerId);
				winnerName = winner?.name;
				winnerScore = computePlayerDerived(state, state.winnerId).cumulative;
			}
			summaries.push({
				id,
				valid: true,
				playerNames: state.players.map((p) => p.name),
				updatedAt: parsed.updatedAt,
				status: state.status,
				winnerName,
				winnerScore
			});
		} catch {
			summaries.push({ id, valid: false, playerNames: [], updatedAt: 0, status: 'in_progress' });
		}
	}
	return summaries.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function deleteGame(id: string): void {
	if (!isBrowser()) return;
	window.localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
	writeIndex(readIndex().filter((existing) => existing !== id));
}

export interface StorageUsage {
	bytes: number;
	quotaBytes: number;
	/** 0..1 estimate of how full the origin's localStorage is. */
	ratio: number;
}

/** Estimates localStorage usage against a typical browser quota (no standard API exposes the real one). */
export function getStorageUsage(): StorageUsage {
	if (!isBrowser()) return { bytes: 0, quotaBytes: ASSUMED_QUOTA_BYTES, ratio: 0 };
	let bytes = 0;
	for (let i = 0; i < window.localStorage.length; i++) {
		const key = window.localStorage.key(i);
		if (!key) continue;
		bytes += (key.length + (window.localStorage.getItem(key)?.length ?? 0)) * 2;
	}
	return { bytes, quotaBytes: ASSUMED_QUOTA_BYTES, ratio: bytes / ASSUMED_QUOTA_BYTES };
}

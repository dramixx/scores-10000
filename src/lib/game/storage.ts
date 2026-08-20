import type { Game } from './types';
import { currentState } from './engine';

const STORAGE_PREFIX = 'tenk:game:';
const INDEX_KEY = 'tenk:games-index';

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

/** Lists resumable (in-progress) games, most recently updated first. Corrupt entries are included as invalid. */
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
			summaries.push({
				id,
				valid: true,
				playerNames: state.players.map((p) => p.name),
				updatedAt: parsed.updatedAt,
				status: state.status
			});
		} catch {
			summaries.push({ id, valid: false, playerNames: [], updatedAt: 0, status: 'in_progress' });
		}
	}
	return summaries
		.filter((s) => !s.valid || s.status === 'in_progress')
		.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function deleteGame(id: string): void {
	if (!isBrowser()) return;
	window.localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
	writeIndex(readIndex().filter((existing) => existing !== id));
}

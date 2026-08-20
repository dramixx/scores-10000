export function relativeTime(timestamp: number, now: number = Date.now()): string {
	const diffMs = now - timestamp;
	const minute = 60_000;
	const hour = 60 * minute;
	const day = 24 * hour;

	if (diffMs < minute) return "à l'instant";
	if (diffMs < hour) {
		const minutes = Math.floor(diffMs / minute);
		return `il y a ${minutes} min`;
	}
	if (diffMs < day) {
		const hours = Math.floor(diffMs / hour);
		return `il y a ${hours} h`;
	}
	if (diffMs < 2 * day) {
		const time = new Date(timestamp).toLocaleTimeString('fr-FR', {
			hour: '2-digit',
			minute: '2-digit'
		});
		return `hier, ${time}`;
	}
	const days = Math.floor(diffMs / day);
	if (days < 7) return `il y a ${days} j`;
	return new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function formatDuration(ms: number): string {
	const minutes = Math.round(ms / 60_000);
	if (minutes < 1) return '< 1 min';
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	const remaining = minutes % 60;
	return remaining > 0 ? `${hours} h ${remaining} min` : `${hours} h`;
}

export function formatScore(score: number): string {
	return score.toLocaleString('fr-FR');
}

export const combinations = [
	{ label: '1 isolé', points: '100' },
	{ label: '5 isolé', points: '50' },
	{ label: 'Brelan (trois dés identiques)', points: 'dé × 100' },
	{ label: 'Brelan de 1', points: '1 000' },
	{ label: 'Carré (quatre dés identiques)', points: 'brelan × 2' },
	{ label: 'Suite (1-2-3-4-5 ou 2-3-4-5-6)', points: '1 000' },
	{ label: 'Full (un brelan + une paire)', points: 'brelan + brelan' },
	{ label: 'Yam (cinq dés identiques)', points: 'carré × 2' }
];

export const specialRules = [
	{
		title: 'Croix ❌',
		description: 'Un tour à 0 point donne une croix, si le joueur a déjà marqué au moins un point.'
	},
	{
		title: '3 croix consécutives',
		description:
			"Le dernier tour valide est annulé : le score retombe à la valeur d'avant, et les croix repartent de zéro."
	},
	{
		title: 'Score identique',
		description:
			"Tomber pile sur le score cumulé d'un adversaire lui fait perdre son dernier tour valide, comme s'il avait subi 3 croix."
	},
	{
		title: 'Reprise des dés',
		description:
			"Un joueur peut continuer le tour du précédent en relançant les dés qui n'avaient pas marqué (hors application)."
	}
];

export const gameGoal =
	"Être le premier joueur à atteindre ou dépasser 10 000 points cumulés. On lance 5 dés, on garde au moins un dé qui marque des points, puis on relance ou on s'arrête et on conserve les points — sauf si les 5 dés marquent, auquel cas il faut continuer.";

export const turnExample =
	"Exemple : au premier lancer, un joueur obtient 1, 1, 5, 3, 4. Il garde les deux 1 (200 pts) et le 5 (50 pts), soit 250 points, puis relance les deux dés restants pour tenter d'en gagner davantage, ou s'arrête et valide ses 250 points.";

export const endOfGame =
	'La partie se termine dès qu’un joueur atteint ou dépasse 10 000 points ; il est déclaré vainqueur et la partie ne peut plus être modifiée.';

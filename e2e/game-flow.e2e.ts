import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await page.evaluate(() => window.localStorage.clear());
	await page.reload();
});

async function createGame(page: import('@playwright/test').Page, names: string[]) {
	await page.getByRole('button', { name: 'Créer une nouvelle partie' }).click();
	await expect(page).toHaveURL('/new');

	const minus = page.getByRole('button', { name: 'Retirer un joueur' });
	// default count is 3; adjust to names.length
	let current = 3;
	while (current > names.length) {
		await minus.click();
		current -= 1;
	}
	const plus = page.getByRole('button', { name: 'Ajouter un joueur' });
	while (current < names.length) {
		await plus.click();
		current += 1;
	}

	for (let i = 0; i < names.length; i++) {
		await page.getByLabel(`Nom du joueur ${i + 1}`).fill(names[i]);
	}
	await page.getByRole('button', { name: 'Commencer la partie' }).click();
	await expect(page).toHaveURL(/\/game\//);
}

async function enterScore(page: import('@playwright/test').Page, digits: number) {
	const s = String(digits);
	for (const ch of s) {
		await page.getByRole('button', { name: ch, exact: true }).click();
	}
	await page.getByRole('button', { name: 'Valider' }).click();
}

test('home page shows title and CTA', async ({ page }) => {
	await expect(page.getByRole('heading', { name: '10000' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Créer une nouvelle partie' })).toBeVisible();
});

test('creating a game requires all player names', async ({ page }) => {
	await page.getByRole('button', { name: 'Créer une nouvelle partie' }).click();
	const start = page.getByRole('button', { name: 'Commencer la partie' });
	await expect(start).toBeDisabled();
	await page.getByLabel('Nom du joueur 1').fill('Léa');
	await expect(start).toBeDisabled();
	await page.getByLabel('Nom du joueur 2').fill('Marc');
	await page.getByLabel('Nom du joueur 3').fill('Sofia');
	await expect(start).toBeEnabled();
});

test('plays a full round and rotates the active player', async ({ page }) => {
	await createGame(page, ['Léa', 'Marc']);
	await expect(page.getByText('Manche 1')).toBeVisible();

	await enterScore(page, 500);
	await expect(page.getByText('500', { exact: true }).first()).toBeVisible();

	// active player should now be Marc
	await expect(page.getByText('reste 10 000 pts')).toBeVisible();
	await enterScore(page, 300);
	await expect(page.getByText('Manche 2')).toBeVisible();
});

test('a cross does not increment score, and undo restores the previous state', async ({ page }) => {
	await createGame(page, ['Léa', 'Marc']);
	await enterScore(page, 500);
	await page.getByRole('button', { name: 'Croix' }).click(); // Marc crosses
	await expect(page.getByText('Manche 2')).toBeVisible();

	await page.getByRole('button', { name: 'Annuler la dernière action' }).click();
	await expect(page.getByText('Manche 1')).toBeVisible();
});

test('a player reaching 10000 wins and the game screen shows the victory summary', async ({
	page
}) => {
	await createGame(page, ['Léa', 'Marc']);
	for (const ch of '10000') {
		await page.getByRole('button', { name: ch, exact: true }).click();
	}
	await page.getByRole('button', { name: 'Valider' }).click();

	await expect(page.getByText('Vainqueur')).toBeVisible();
	await expect(page.getByText('Léa', { exact: true }).first()).toBeVisible();
	await expect(page.getByRole('button', { name: 'Rejouer', exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Accueil', exact: true })).toBeVisible();
});

test('rules dialog opens from the home screen', async ({ page }) => {
	await page.getByRole('button', { name: 'Règles du jeu →' }).click();
	await expect(page.getByRole('heading', { name: 'Règles', exact: true })).toBeVisible();
	await expect(page.getByText('Brelan de 1')).toBeVisible();
});

test('a resumable game appears in the home list and can be deleted', async ({ page }) => {
	await createGame(page, ['Léa', 'Marc']);
	await enterScore(page, 500);
	await page.goto('/');

	await expect(page.getByText('Léa · Marc')).toBeVisible();
	await page.getByRole('button', { name: 'Reprendre' }).click();
	await expect(page).toHaveURL(/\/game\//);
	await expect(page.getByText('500', { exact: true }).first()).toBeVisible();

	await page.goto('/');
	await page.getByRole('button', { name: 'Supprimer la partie' }).click();
	await page.getByRole('button', { name: 'Supprimer', exact: true }).click();
	await expect(page.getByText('Léa · Marc')).toHaveCount(0);
});

test('a finished game appears in history and revisiting shows the victory stats', async ({
	page
}) => {
	await createGame(page, ['Léa', 'Marc']);
	await enterScore(page, 10000);
	await expect(page.getByText('Vainqueur')).toBeVisible();

	await page.goto('/');
	await expect(page.getByText('Parties terminées')).toBeVisible();
	await expect(page.getByText('Léa · Marc')).toBeVisible();

	await page.getByRole('button', { name: 'Voir' }).click();
	await expect(page).toHaveURL(/\/game\//);
	await expect(page.getByText('Vainqueur')).toBeVisible();
	await expect(page.getByText('Léa', { exact: true }).first()).toBeVisible();
});

test('two consecutive crosses show a XX badge on the cross cell', async ({ page }) => {
	await createGame(page, ['Léa', 'Marc']);
	await enterScore(page, 500); // Léa
	await enterScore(page, 300); // Marc
	await page.getByRole('button', { name: 'Croix' }).click(); // Léa cross 1
	await enterScore(page, 300); // Marc
	await page.getByRole('button', { name: 'Croix' }).click(); // Léa cross 2

	await expect(page.getByText('XX', { exact: true })).toBeVisible();
});

test('the leader column is highlighted in gold', async ({ page }) => {
	await createGame(page, ['Léa', 'Marc']);
	await enterScore(page, 500); // Léa
	await enterScore(page, 300); // Marc

	await expect(page.locator('[data-leader]')).toHaveCount(1);
	await expect(page.locator('[data-leader]').first()).toContainText('500');
});

test('the table auto-scrolls to the latest round', async ({ page }) => {
	await createGame(page, ['Léa', 'Marc']);
	for (let i = 0; i < 20; i++) await enterScore(page, 50);
	await expect
		.poll(() =>
			page.evaluate(() => {
				const el = document.querySelector('table')!.parentElement!;
				return el.scrollHeight - el.clientHeight - el.scrollTop;
			})
		)
		.toBeLessThan(2);
	expect(
		await page.evaluate(() => {
			const el = document.querySelector('table')!.parentElement!;
			return el.scrollTop;
		})
	).toBeGreaterThan(0);
});

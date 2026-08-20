# 10000

Compteur de score pour le jeu de dés « 10000 » (Zanzibar / Farkle). Application
mobile-first, installable en PWA, sans compte ni backend : tout est stocké en
local (`localStorage`) sur l'appareil.

Voir [`FUNCTIONAL_SPEC.md`](./FUNCTIONAL_SPEC.md) pour les règles du jeu et le
détail des comportements attendus.

## Stack

- [SvelteKit](https://svelte.dev/docs/kit) + Svelte 5 (runes)
- [Tailwind CSS v4](https://tailwindcss.com) + composants dans le style
  [shadcn-svelte](https://www.shadcn-svelte.com) (via [bits-ui](https://bits-ui.com))
- PWA via [`@vite-pwa/sveltekit`](https://vite-pwa-org.netlify.app/frameworks/sveltekit)
- Tests unitaires : [Vitest](https://vitest.dev)
- Tests e2e : [Playwright](https://playwright.dev)
- Déploiement : [`adapter-static`](https://svelte.dev/docs/kit/adapter-static) + `Dockerfile` (nginx)

## Développement

```sh
npm install
npm run dev -- --open
```

## Qualité

```sh
npm run lint        # prettier --check + eslint
npm run check        # svelte-check (TypeScript)
npm run test:unit    # vitest (moteur de jeu)
npm run test:e2e     # playwright (parcours utilisateur)
npm run test         # unit + e2e
```

## Build & déploiement

```sh
npm run build
npm run preview
```

Ou via Docker :

```sh
docker build -t scores-10000 .
docker run -p 8080:80 scores-10000
```

L'application est un SPA statique (pas de SSR, pas de backend) : le
`Dockerfile` compile le build statique puis le sert avec nginx (port 80) ;
le déploiement (CD) est géré séparément (Dokploy).

## Architecture

- `src/lib/game/types.ts` — modèle de données (partie, joueurs, tours).
- `src/lib/game/engine.ts` — moteur de jeu pur (aucune dépendance UI) :
  calcul des scores, croix, annulations (3 croix, égalité de score,
  annulation manuelle), victoire, undo/redo, statistiques. Couvert par des
  tests unitaires (`engine.test.ts`).
- `src/lib/game/storage.ts` — persistance dans `localStorage`.
- `src/lib/game/store.svelte.ts` — wrapper réactif (runes) autour du moteur.
- `src/lib/components/game/*` — composants d'interface spécifiques au jeu.
- `src/lib/components/ui/*` — primitives d'interface façon shadcn-svelte.
- `src/routes/` — écran d'accueil, création de partie, écran de jeu.

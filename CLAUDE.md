# Dakar 2026 · Guide des sessions — JOJ Dakar 2026

> Ce fichier est le brief du projet. Lis-le en entier avant d'écrire du code,
> puis lis `docs/SCRAPING.md`, `docs/DATA_MODEL.md` et `docs/UX.md`.

## Le produit en une phrase

Un site **mobile-first** qui répond en 3 secondes à : *« Qu'est-ce que je peux voir
aux JOJ aujourd'hui, où, à quelle heure, est-ce que c'est gratuit, et comment j'y vais ? »*
— avec, pour chaque session, le lien vers la **billetterie officielle**.

Les JOJ Dakar 2026 se déroulent du **31 octobre au 13 novembre 2026** (Baseball5 démarre
dès le 30 octobre), sur **8 sites** répartis en **3 secteurs** : Dakar, Diamniadio, Saly.

## Le problème qu'on résout

L'info officielle existe mais elle est éclatée :

- le programme complet est un **PDF** (par jour / site / session) ;
- la billetterie est une **autre plateforme** (tickets.dakar2026.org) ;
- la gratuité (cyclisme sur route, triathlon, Fan Zones, festival de la Corniche) est
  dans un guide séparé ;
- les déviations et accès sont dans un **guide mobilité PDF**.

On fusionne tout ça en une seule interface rapide, lisible sur un téléphone.

## Règles non négociables

1. **Site non officiel, aucune marque officielle.** Pas d'emblème Dakar 2026, pas d'anneaux
   olympiques, pas de pictogrammes officiels, pas de mascotte (Ayo), pas de slogan ni de photo
   officielle. Les icônes de sport sont des emoji. Footer et page « À propos » : « Site non
   officiel, sans affiliation avec le COJOJ Dakar 2026 ni le CIO. Horaires à vérifier sur les
   sources officielles. » Les couleurs peuvent évoquer l'ambiance des Jeux.
2. **Aucun paiement, aucune collecte de données.** Les billets = lien sortant vers la
   billetterie officielle. Pas de formulaire, pas de compte, pas de cookie de tracking
   (analytics sans cookie type Vercel Analytics OK).
3. **Aucun scraping au runtime.** Les données sont produites hors ligne par `scripts/`,
   écrites dans `data/*.json`, versionnées, et le site les lit au build.
4. **Scraping respectueux** : respecter `robots.txt` et les CGU, 1 requête/seconde max,
   User-Agent honnête avec un contact, **jamais** de contournement d'anti-bot (pas de
   plugin « stealth », pas de rotation d'IP, pas de résolution de captcha). Si une source
   bloque → on bascule sur le plan B décrit dans `docs/SCRAPING.md`.
5. **Ne jamais inventer une donnée.** Pas d'horaire, de lieu, de prix ou de coordonnée GPS
   « plausible ». Champ inconnu = `null` + affichage « à vérifier ». Chaque session garde son
   `sourceUrl`.
6. **Heure locale = Africa/Dakar (UTC+0, pas d'heure d'été).** Tout est stocké en ISO 8601
   avec offset `+00:00`.

## Stack

- **Next.js (App Router) + TypeScript**, génération statique (`export const dynamic = "force-static"`
  ou `generateStaticParams`), revalidation par redeploy.
- **Tailwind CSS**. Pas de librairie UI lourde. Icônes : `lucide-react`.
- **Données** : JSON dans `data/`, validés par **zod** au build (le build échoue si invalide).
- **Ingestion** : Python 3.11 (`pdfplumber`, `httpx`, `pydantic`) dans `scripts/`.
  Playwright (Python) seulement si nécessaire pour la billetterie, et seulement en mode
  « navigateur normal » (voir règle 4).
- **Déploiement** : Vercel. **Refresh** : GitHub Action quotidienne (`.github/workflows/refresh-data.yml`).

## Arborescence cible

```
joj-guide/
├─ CLAUDE.md
├─ docs/                  # SCRAPING.md, DATA_MODEL.md, UX.md
├─ data/
│  ├─ seed/               # écrit à la main : venues, sports, sources, overrides
│  ├─ raw/                # téléchargements bruts (PDF, HTML, JSON) — gitignored sauf manifest
│  ├─ sessions.json       # SORTIE de l'ingestion (lu par le site)
│  ├─ venues.json         # SORTIE (seed enrichi)
│  ├─ sports.json         # SORTIE
│  └─ meta.json           # date de génération, versions des sources, compteurs
├─ scripts/
│  ├─ fetch_sources.py    # télécharge les sources → data/raw/
│  ├─ parse_programme.py  # PDF programme → sessions brutes
│  ├─ parse_tickets.py    # billetterie → liens par code session (plan A/B/C)
│  ├─ build_data.py       # normalise, fusionne, applique overrides, écrit data/*.json
│  └─ validate.py         # contrôles de cohérence (voir SCRAPING.md §6)
├─ src/
│  ├─ app/                # routes (voir docs/UX.md)
│  ├─ components/
│  └─ lib/                # data.ts (chargement + zod), time.ts, ics.ts, filters.ts
└─ .github/workflows/refresh-data.yml
```

## Ordre de travail (ne pas sauter d'étape)

1. **Ingestion d'abord, UI ensuite.** Tant que `python scripts/validate.py` n'est pas vert,
   on ne touche pas à l'interface.
2. Phase 1 — `fetch_sources.py` + `parse_programme.py` → `data/sessions.json` complet.
3. Phase 2 — `parse_tickets.py` + `build_data.py` (fusion, gratuité, overrides) + `validate.py`.
4. Phase 3 — UI : écran « Aujourd'hui » d'abord, puis Programme, Sites, Fiche session.
5. Phase 4 — polish mobile, `.ics`, SEO, OG image, déploiement, Action de refresh.

À la fin de chaque phase : résume ce qui marche, ce qui manque, et les anomalies trouvées
dans les sources (je les montre en vidéo).

## Définition de « fini »

- [ ] `validate.py` passe : chaque jour du PDF a le même nombre de sessions que `sessions.json`.
- [ ] Les 8 sites ont un secteur, des alias, et une note d'accès (ou `null`).
- [ ] Lighthouse mobile ≥ 90 en Performance et Accessibilité sur `/`.
- [ ] Page d'accueil < 150 KB de JS. Lisible en plein soleil (contrastes AA).
- [ ] Chaque session : horaire, site, sport, épreuves, badge Gratuit/Payant/Inconnu,
      lien billetterie ou « voir la billetterie officielle », bouton agenda, itinéraire.
- [ ] Footer de toutes les pages : mention « non officiel » et « horaires à vérifier ».
- [ ] `meta.json.generatedAt` affiché discrètement : « Données mises à jour le … ».

## Ton et langue

Interface **en français**, tutoiement léger, phrases courtes. Noms de sports en français
(table de correspondance dans `data/seed/sports.json`). Garder les codes de session
(ex. `ATH01`) visibles en petit : c'est ce que les gens retrouvent sur la billetterie.

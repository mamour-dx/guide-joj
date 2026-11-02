# UX, écrans et design

## Principes

- **Pensé pour un téléphone, dehors, en plein soleil, en 4G moyenne.** 360 px de large
  d'abord. Gros contrastes, grosses cibles tactiles (≥ 44 px), texte ≥ 16 px.
- **La réponse avant la navigation** : l'accueil montre directement ce qui se passe
  maintenant et ensuite. Pas de hero, pas de carrousel.
- **Deux taps max** pour aller de l'accueil à « Acheter / Y aller ».
- Navigation basse fixe (3 onglets) : **Aujourd'hui · Programme · Sites**.
- Fonctionne sans JS pour l'essentiel (pages statiques) ; les filtres sont du bonus.

## Écrans

### 1. `/` — Aujourd'hui
- En-tête : date du jour + sélecteur rapide `Aujourd'hui · Demain`.
- Section **En ce moment** (sessions où `start ≤ maintenant < end`), puis **Plus tard
  aujourd'hui**, triées par heure de début.
- Puces filtres (scroll horizontal) : `Gratuit` · `Finales` · `Dakar` · `Diamniadio` ·
  `Saly` · sports.
- Carte session (composant `SessionCard`) :
  `10:00–14:37 · ATH02` / **Athlétisme** 🏃 / Complexe Iba Mar Diop · Dakar /
  badges `Finale` `Gratuit` / 2 premières épreuves + « +14 ».
- Hors période des Jeux : afficher le prochain jour avec des sessions.
- L'heure « maintenant » vient du navigateur **convertie en Africa/Dakar** (un visiteur
  à Paris doit voir le bon « en ce moment »).

### 2. `/programme` — Programme complet
- Bandeau de jours qui défile (`Ven 30` … `Ven 13`), jour courant sélectionné.
- Mêmes filtres. Regroupement par secteur puis par heure.
- Recherche texte (sport, pays « SEN », épreuve « 100m ») — filtrage local, sans lib lourde.
- Filtres dans l'URL (`?jour=2026-11-09&secteur=saly&gratuit=1`) → partageable sur WhatsApp.

### 3. `/sites` et `/sites/[id]`
- Liste des 8 sites groupés par secteur, avec le nombre de sessions restantes.
- Fiche site : note d'accès (guide mobilité, citée), bouton **Itinéraire** (Google Maps :
  `https://www.google.com/maps/dir/?api=1&destination=<lat,lng ou mapsQuery>`),
  sessions à venir.
- Pas de carte interactive lourde au départ ; si le temps le permet : une carte statique
  légère (Leaflet + tuiles OSM) chargée à la demande.

### 4. `/session/[id]` — Fiche session
- Titre sport + code session en évidence (« Cherche ATH02 sur la billetterie »).
- Horaires, site, secteur, toutes les épreuves (FR, avec l'original EN repliable).
- **CTA principal** :
  - `isFree === true` → badge « Gratuit » + « Comment y aller » ;
  - `ticketUrl` → « Acheter sur la billetterie officielle ↗ » (lien sortant,
    `rel="noopener"`), avec mention du statut (places limitées, complet, annulé) ;
  - sinon → « Ouvrir la billetterie officielle ↗ » + code session à chercher.
- Secondaires : **Ajouter à mon agenda** (`.ics` généré côté client, TZ Africa/Dakar),
  **Itinéraire**, **Partager** (Web Share API, fallback copie du lien).
- Mention : « Horaires issus du programme officiel publié le 30/10. À vérifier sur la
  billetterie. »

### 5. `/a-propos`
- Ce qu'est le site, d'où viennent les données (liste des sources avec liens), date de
  mise à jour, Ayo (si `officialBranding`), contact. Lien vers la chaîne MXR CODES.

## Design tokens

Identité **Dakar 2026**, relevée dans le guide médias du COJOJ (oct. 2026) et la charte
olympique (résumé dans le kit de marque) : aplats de bleu, beaucoup de blanc, titres condensés
en capitales, texte courant noir. Valeurs exactes dans `src/app/globals.css`.

| Rôle | Valeur |
|---|---|
| Bleu Dakar 2026 (en-tête, boutons, onglet actif) | `#0078D0`, texte blanc 4,57:1 |
| Bleu texte / liens | `#005FA8` |
| Encart (cartes, panneaux) | `#E6F1FA`, coin bas-droit coupé (`.chamfer`) |
| Secteurs (carré de repère, texte noir) | Dakar `#EE334E`, Diamniadio `#00A651`, Saly `#FCB131` (plan directeur) |
| Badges | Gratuit = jaune olympique + noir ; Finale = noir ; En ce moment = `#C8102E` + blanc |

- **Marques** (`src/components/Brand.tsx`, fichiers dans `public/brand/`) : emblème horizontal
  blanc sur bleu dans l'en-tête, emblème vertical couleurs sur blanc dans le pied de page,
  25 pictogrammes officiels sur les cartes, Ayo sur « À propos » et « Jeux terminés », motif
  du « look des Jeux » en bande sous l'en-tête. Jamais modifiés. Emblème couleurs = fond blanc.
- La couleur n'est jamais celle du texte courant. Le jaune ne sert jamais de texte.
- Typo : titres en **Bebas Neue** (substitut public de l'« Olympic Headline », capitales,
  ≤ 6 mots), tout le reste en **Inter**. Chiffres tabulaires pour les horaires.
- Angles droits partout (pas de coins arrondis), filets fins, pointillés bleus du guide médias.
- Mode sombre : fond noir (recommandé par la charte en numérique), emblème et pictogrammes
  restent sur blanc.

## Performance

- Pages statiques, une page par session (`generateStaticParams`), une par site.
- `sessions.json` découpé par jour pour le client (`/data/day-2026-11-09.json`) afin de ne
  pas charger les ~250 sessions sur l'accueil.
- Images : aucune image lourde. OG image générée (`next/og`) avec titre + date, emblème et motif.

## Accessibilité

- Contrastes AA, focus visibles, `aria-current` sur l'onglet actif, puces filtres en
  `button` avec `aria-pressed`.
- Les heures en texte (pas seulement en couleur ou icône).
- `lang="fr"`.

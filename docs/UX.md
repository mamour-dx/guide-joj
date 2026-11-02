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
  mise à jour, mention « non officiel », contact. Lien vers la chaîne MXR CODES.

## Design tokens

Palette **inspirée des couleurs du Sénégal et de l'habillage de la ville pendant les Jeux**.
Pas de logo, pas d'emblème, pas de mascotte, pas de reprise des formes graphiques
officielles. Pour coller encore plus à l'ambiance : prendre en photo l'habillage de la ville
(city look) et ajuster les valeurs au compte-gouttes — les couleurs ne sont pas la marque,
le logo oui.

```css
:root {
  --green-600: #00853F;   /* vert drapeau — actions principales */
  --green-50:  #E6F4EC;
  --yellow-400:#FDEF42;   /* jaune drapeau — badge "Gratuit", surlignage */
  --red-600:   #E31B23;   /* rouge drapeau — "En ce moment", alertes */
  --sand-50:   #FBF7EF;   /* fond clair, évoque la plage de Saly */
  --ink-900:   #14161A;   /* texte */
  --ink-500:   #5B616B;   /* texte secondaire */
  --ocean-600: #0B6E99;   /* secteur Saly */
  --sun-500:   #F28C28;   /* secteur Diamniadio */
  /* secteur Dakar = --green-600 */
}
@media (prefers-color-scheme: dark) {
  :root { --sand-50: #0F1113; --ink-900: #F2F2F2; --ink-500: #A3A9B3; }
}
```

- Le jaune **ne sert jamais** de couleur de texte sur fond clair (contraste insuffisant) :
  uniquement en fond de badge avec texte `--ink-900`.
- Chaque secteur a sa couleur (pastille + bordure gauche de la carte) : repère visuel
  immédiat sur le lieu.
- Typo : une seule famille, système ou `Inter`/`Manrope` via `next/font` (auto-hébergée).
  Chiffres tabulaires pour les horaires (`font-variant-numeric: tabular-nums`).
- Motif décoratif optionnel : bande fine en haut de page vert/jaune/rouge (3 px). Sobre.

## Performance

- Pages statiques, une page par session (`generateStaticParams`), une par site.
- `sessions.json` découpé par jour pour le client (`/data/day-2026-11-09.json`) afin de ne
  pas charger les ~250 sessions sur l'accueil.
- Images : aucune image lourde. OG image générée (`next/og`) avec titre + date, sans logo.

## Accessibilité

- Contrastes AA, focus visibles, `aria-current` sur l'onglet actif, puces filtres en
  `button` avec `aria-pressed`.
- Les heures en texte (pas seulement en couleur ou icône).
- `lang="fr"`.

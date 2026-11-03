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
- Bascule **Liste / Carte** (liste par défaut, sans JS ; `#carte` rouvre la carte).
  La carte (Leaflet + tuiles OSM, ~45 Ko gz) n'est téléchargée qu'au premier passage sur
  « Carte ». Boutons de secteur pour zoomer (Dakar, Diamniadio, Saly), pastilles aux couleurs
  des secteurs, noms affichés une fois zoomé ; toucher un site ouvre un panneau en bas
  (sessions à venir, « Voir le site », « Itinéraire »). Seuls les sites aux lat/lng vérifiés
  sont placés ; les autres sont signalés sous la carte.

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

Direction inspirée de meetsponsors.com, aux couleurs olympiques : fond blanc cassé, encre noire,
titres condensés très gras en capitales terminés par un point, petites étiquettes en mono, angles
droits, filets noirs de 2 px, grands aplats de couleur pleine largeur. Valeurs exactes dans
`src/app/globals.css`.

| Rôle | Valeur |
|---|---|
| Fond / encre | `#F6F6F3` / `#000000` ; boutons = bloc noir, texte blanc cassé |
| Couleurs olympiques | Jaune `#FFB114`, Noir `#000000`, Vert `#00A651`, Rouge `#F0282D` |
| En-têtes de page (aplat `.bleed`) | Aujourd'hui vert (Demain jaune), Programme jaune, Sites rouge, À propos noir ; fiche session et fiche site à la couleur du secteur |
| Secteurs (carré de repère, texte noir) | Dakar rouge, Diamniadio vert, Saly jaune |
| Badges | Gratuit = jaune + noir ; Finale = noir ; En ce moment = rouge + noir |

- Sur un aplat de couleur, le texte est toujours noir (rouge 5,0:1, vert 6,6:1, jaune 11:1).
- Typo : titres en **Big Shoulders** 800, texte en **Geist**, horaires, codes et sur-titres en
  **Geist Mono**.
- **Marques** (`src/components/Brand.tsx`, fichiers dans `public/brand/`) : emblème horizontal
  blanc sur bleu dans l'en-tête, emblème vertical couleurs sur blanc dans le pied de page,
  25 pictogrammes officiels sur les cartes, Ayo sur « À propos » et « Jeux terminés », motif
  du « look des Jeux » réservé à l'image de partage. Jamais modifiés. Emblème couleurs = fond blanc.
- La couleur n'est jamais celle du texte courant. Le jaune ne sert jamais de texte.
- Angles droits partout (pas de coins arrondis), pas d'ombres, pointillés pour les séparations fines.
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

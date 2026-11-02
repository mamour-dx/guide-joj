# Stratégie de récupération des données

C'est la partie difficile du projet. Le principe : **une source de vérité par type
d'info**, une **clé de jointure** fiable entre les sources, et un **contrôle automatique**
avant chaque publication.

---

## 1. Les sources (par ordre de fiabilité)

| # | Source | Ce qu'on en tire | Format | Rôle |
|---|--------|------------------|--------|------|
| S1 | **Programme des compétitions par jour, discipline et site** — publié le 30/10/2026 sur vie-publique.sn | Toutes les sessions : jour, horaire, secteur, site, code session, discipline, épreuves | PDF texte (~174 KB) | **Source de vérité du calendrier** |
| S2 | **Billetterie officielle** — tickets.dakar2026.org (app Next.js) | Lien d'achat par session, statut (places limitées, complet, annulé), sessions non sportives (Fan Zones, Festival) | HTML/JSON, **protégé anti-bot** | Enrichissement : liens + disponibilité |
| S3 | **Guide mobilité Dakar JOJ 2026** — vie-publique.sn | Déviations, accès, conseils par site | PDF | Notes d'accès par site |
| S4 | **Guide officiel des JOJ** (COJOJ, oct. 2026) — vie-publique.sn | Plan des sites, sports par site | PDF (~8 MB) | Contrôle croisé des sites |
| S5 | **olympics.com/fr/dakar-2026** (programme, sites, sports) | Contrôle croisé, liens officiels | HTML | Liens « source officielle » |

Les URLs exactes sont dans `data/seed/sources.json`. **Ne pas en inventer d'autres.**
Si une URL est morte : la signaler, ne pas deviner.

> Pourquoi le PDF est la source n°1 : il est public, publié par un site gouvernemental,
> structuré, complet (Day -1 → Day 13), et sans anti-bot. La billetterie n'expose que les
> sessions en vente et bloque les robots.

---

## 2. La clé de jointure : le code de session

Le PDF et la billetterie utilisent **les mêmes codes de session** :
`BDM05`, `EQU01`, `WST05`, `RU704`… C'est notre clé primaire.

Format observé : **préfixe sport (2 à 3 caractères, peut finir par un chiffre) + numéro
(2 à 3 chiffres)**. Exemples réels : `BS501`, `RU701`, `BK301`, `GAR100`, `SKB01`, `CRD02`.

```python
SESSION_CODE = re.compile(r"^(BS5|RU7|BK3|[A-Z]{3})(\d{2,3})$")
```

La table préfixe → sport est dans `data/seed/sports.json` (25 sports). **Tout code dont le
préfixe est inconnu fait échouer `validate.py`.**

**Exceptions côté billetterie** (codes qui n'existent pas dans le PDF) :
- `SBWxx` — billets « Saly Plage Ouest » qui couvrent **plusieurs** sessions sportives le
  même jour (ex. Beach-volley + Aviron beach sprints) ;
- `CTOxx` — Pass Fan Zone du Complexe Tour de l'Œuf ;
- `CORxx` — Festival de la Corniche Ouest.

→ Jointure de secours : **site + date** (et chevauchement d'horaires). Voir §5.

---

## 3. Parser le PDF programme (S1)

### Structure observée

```
Date & Time | Cluster | Venue | Session | Discipline | Event
Day 1 1 November 2026.
09:00 - 12:40  Diamniadio  Dakar Arena  BDM01  Badminton  Women's and Men's singles - group stage
10:00 - 12:30  Diamniadio  Dakar Expo Centre  JUD01  Judo
                                                      Men - 55kg - Preliminary Rounds
                                                      Women -44kg - Preliminary Rounds
```

Pièges réels repérés :
- **Épreuves multi-lignes** : une session = 1 ligne principale + N lignes d'épreuves
  (jusqu'à 16 pour l'athlétisme). Parfois la 1ʳᵉ épreuve est sur la ligne principale,
  parfois non.
- **En-tête de jour collé à une ligne** : `Day 13 13 November 2026. 09:30 - 13:51 Saly…`.
- **En-têtes de page répétés** : `Date & Time Cluster Venue…` et
  `Dakar 2026 - Competition Schedule by Day, Session and Events` → à ignorer.
- **Noms de site à plusieurs mots** (`Complexe Tour de l'Oeuf`, `Saly Beach West`) qui se
  répètent quand Cluster = Venue (`Saly Beach West Saly Beach West`).
- **Épreuves coupées en fin de ligne** : `Table of` / `8` sur deux lignes,
  `(Bronze and Gold` sans parenthèse fermante.
- **Coquilles de la source** : `quaterfinals`, une épreuve en double (`Women's 400m
  Hurdles - semi & final` ×2 dans ATH02), `Men's Street - Finals` sous la gymnastique
  (GAR101), `Women's and Men's singles` pour le basket 3x3 et le handball de plage.
  **On ne corrige pas en silence** : on garde le texte source dans `eventsRaw`, on
  corrige dans `overrides.json` si nécessaire, et `validate.py` liste les anomalies.

### Méthode recommandée

**Ne pas parser le texte ligne à ligne avec des regex seules.** Utiliser les positions :

1. `pdfplumber` → `page.extract_words(keep_blank_chars=False, use_text_flow=False)`.
2. Sur chaque page, repérer l'en-tête `Date & Time | Cluster | Venue | Session | Discipline
   | Event` et mémoriser le **x0 de chaque colonne**. (S'il n'y a pas d'en-tête sur une
   page, réutiliser les bornes de la page précédente.)
3. Regrouper les mots en lignes par `top` (tolérance ±2 pt), puis affecter chaque mot à
   une colonne selon son `x0`.
4. Machine à états :
   - ligne qui contient `Day <n> <d> <Month> 2026.` → nouveau jour (le reste de la ligne
     peut contenir une session : continuer le traitement) ;
   - ligne avec un horaire `HH:MM - HH:MM` → **nouvelle session** ;
   - ligne avec seulement la colonne Event remplie → **épreuve de la session courante** ;
   - ligne d'épreuve qui ne commence pas par une majuscule ou un chiffre de catégorie
     (ex. `8`, `Medal Battles)`) → **concaténer à l'épreuve précédente**.
5. Sortie : `data/raw/programme.sessions.json` (liste brute, une entrée par session).

Garde-fou : si l'extraction par colonnes échoue (bornes introuvables), fallback
`extract_text()` + regex sur la ligne principale :

```python
MAIN = re.compile(
  r"^(?P<start>\d{2}:\d{2})\s*-\s*(?P<end>\d{2}:\d{2})\s+"
  r"(?P<cluster>Dakar|Diamniadio|Saly)\s+(?P<rest>.+?)\s+"
  r"(?P<code>(?:BS5|RU7|BK3|[A-Z]{3})\d{2,3})\s+(?P<tail>.*)$"
)
```
`rest` = nom du site (à matcher contre les alias de `venues.json`) ; `tail` = discipline +
éventuelle 1ʳᵉ épreuve (la discipline se déduit du **préfixe du code**, pas du texte).

> 💡 Moment vidéo : montrer le PDF brut, puis la même journée en JSON propre.
> Option : donner une page du PDF à Claude pour générer les tests unitaires du parser
> (fixtures = 3 pages réelles, résultats attendus écrits à la main et relus).

---

## 4. Billetterie (S2) — plan A / B / C

La billetterie est une app Next.js protégée par une détection de robots. Règle : **on se
comporte comme un visiteur, ou on ne la touche pas.**

**Plan A — repérer l'API publique (10 min, à faire en premier, à la main).**
Ouvrir `https://tickets.dakar2026.org/fr` dans Chrome → DevTools → Network → filtre
`Fetch/XHR` → cliquer « Voir tout le programme ». Si une requête renvoie la liste des
sessions en JSON (codes, dates, liens, statut) :
- noter l'URL et les paramètres dans `data/seed/sources.json` (`tickets.apiNotes`) ;
- **sauvegarder la réponse à la main** dans `data/raw/tickets.json` (clic droit → Save
  response) ;
- `parse_tickets.py` lit ce fichier. Pas d'appel automatique à cette API depuis la CI tant
  qu'on n'a pas vérifié robots.txt et les CGU.

**Plan B — export manuel de la page programme.**
Si pas d'API exploitable : enregistrer la page programme complète (Ctrl+S, « page web
complète ») dans `data/raw/tickets.html`, et parser le HTML (sélecteurs sur les cartes :
titre, code session, site, date/heure, statut « Places limitées », lien « ACHETER DES
BILLETS »).

**Plan C — pas de lien profond.**
Si ni A ni B ne donnent d'URL par session : chaque fiche affiche le **code session** en
gros + un bouton « Ouvrir la billetterie officielle » vers la page programme. On écrit dans
l'UI : « Cherche le code ATH01 ». Ça reste utile et honnête.

Ce qu'on ne fait **pas** : Playwright headless en boucle, plugins stealth, rotation d'IP,
contournement de captcha, en-têtes imitant un navigateur, cookies copiés.

**Mise à jour du 2026-11-02 — plan A automatisé.** L'endpoint a été identifié
(`POST /api/ticketing`, formulaire `startDate`, `endDate`, `productIds` : voir
`sources.json` → `tickets.api`). Un test unique avec notre User-Agent, sans cookie ni en-tête
de navigateur, a donné : `robots.txt` absent (404), endpoint 200 `application/json`, pas de
challenge. Les CGU de la billetterie ne contiennent aucune clause sur l'accès automatisé.
Décision : `fetch_sources.py` fait **une requête par jour** depuis la GitHub Action, sans
retry. Si la réponse n'est pas le JSON attendu (erreur HTTP, challenge, JSON vide), on garde
le dernier `data/raw/tickets.json` valide, sans faire échouer le rafraîchissement. Si la
billetterie bloque un jour la CI, on revient à la sauvegarde manuelle (plan A d'origine).

---

## 5. Fusion et normalisation (`build_data.py`)

1. **Sites** : résoudre chaque nom (PDF, billetterie) via `venues.json[].aliases`
   (comparaison insensible à la casse, aux accents, aux apostrophes et à ce qui suit une
   parenthèse : `Centre des Expositions de Dakar(Pavillon C)` → `dakar-expo-centre`, avec
   `hall: "Pavillon C"`). Nom non résolu → échec de `validate.py`.
2. **Horaires** : `"2026-11-08T14:30:00+00:00"`. Si `end < start` (après minuit) → +1 jour.
3. **Jointure billetterie** :
   - a. code identique → `ticketUrl`, `ticketStatus` ;
   - b. sinon même `venueId` + même date + créneau qui chevauche → lien partagé
     (`ticketMatch: "venue-day"`) — cas `SBWxx` ;
   - c. sinon `ticketUrl: null`, `ticketMatch: "none"` → plan C dans l'UI.
4. **Gratuité** (`isFree`) — **uniquement** depuis `overrides.json` (sources citées) :
   cyclisme sur route (`CRD*`) et triathlon (`TRI*`) annoncés gratuits par le guide de
   billetterie ; Fan Zones et Festival Corniche gratuits. Tout le reste : `null` (=
   « prix sur la billetterie »), jamais `false` par défaut.
5. **Finales** : `hasFinal = true` si une épreuve matche
   `/\b(final|finals|gold medal|final block|final rounds)\b/i`
   (`semi & final` compte comme finale ; `Semifinals` seul, non). C'est un badge « Finale »,
   **pas** « médaille » : on n'invente pas le nombre de médailles.
6. **Événements non sportifs** (Fan Zone, Festival) : `kind: "fan"` — ils n'ont pas de code
   PDF, ils viennent de la billetterie ou de `overrides.json`.
7. Écrire `data/sessions.json`, `data/venues.json`, `data/sports.json`, `data/meta.json`
   (dont `generatedAt`, hash SHA-256 de chaque fichier source, compteurs).

---

## 6. Contrôles (`validate.py`) — le build ne part pas si un contrôle échoue

- Nombre de sessions par jour = nombre d'horaires `HH:MM - HH:MM` détectés dans le texte
  brut de la page du PDF (deux méthodes indépendantes doivent donner le même total).
- Codes de session uniques ; préfixes tous connus ; numéros croissants par sport.
- Chaque session a un site résolu et un secteur cohérent avec le site.
- Toutes les dates entre le 30/10/2026 et le 13/11/2026.
- `start < end` ; durée < 12 h.
- Aucune session sans épreuve (attention : l'épreuve est parfois sur la ligne principale,
  ex. `BS506 Baseball5 Quarterfinals` — elle doit être récupérée, pas perdue).
- Rapport `data/validation-report.md` : anomalies de la source (doublons, coquilles),
  sessions sans lien billetterie, sites sans note d'accès. **Avertissements** ≠ erreurs.
- Contrôle croisé humain : spot-check de 10 sessions au hasard contre le PDF (le script en
  tire 10 et les affiche avec la page du PDF).

---

## 7. Refresh pendant les Jeux

- **GitHub Action** quotidienne (06:00 Dakar) : re-télécharge **S1 et S3 uniquement**,
  recalcule, compare les hash. Si rien n'a changé → stop. Si changement → `build_data.py`
  + `validate.py` → commit → Vercel redeploie. Si `validate.py` échoue → l'Action échoue et
  **rien n'est publié** (le site garde la dernière version valide).
- Billetterie : refresh manuel (§4).
- Si le COJOJ publie une nouvelle version du PDF sous une autre URL : mettre à jour
  `sources.json`, pas le code.

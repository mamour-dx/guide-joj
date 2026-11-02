# Rapport de validation — 2026-11-02T19:23+00:00

**✅ OK** — 0 erreur(s), 8 avertissement(s). Données générées le 2026-11-02T19:23:14+00:00.

## Compteurs

- Sessions : 212 (185 sportives, 27 Fan)
- Billetterie : code 143 · site+jour 25 · aucun 44
- Gratuites : 21 · Finales : 56

| Jour | PDF (texte brut) | sessions.json |
|---|---|---|
| -1 | 2 | 2 |
| 0 | 4 | 4 |
| 1 | 18 | 18 |
| 2 | 18 | 18 |
| 3 | 19 | 19 |
| 4 | 11 | 11 |
| 5 | 13 | 13 |
| 6 | 10 | 10 |
| 7 | 12 | 12 |
| 8 | 19 | 19 |
| 9 | 18 | 18 |
| 10 | 14 | 14 |
| 11 | 12 | 12 |
| 12 | 13 | 13 |
| 13 | 2 | 2 |

## Erreurs

Aucune.

## Avertissements

- GAR : deux séries de numérotation 2 chiffres (dès le 2026-11-07), 3 chiffres (dès le 2026-11-05)
- gratuité TRI* non appliquée : source non vérifiée ('A_VERIFIER: URL du guide officiel du spectateur (annonce sur tickets.dakar2026.org)') dans overrides.json
- GAR101 : Épreuve 'Men's Street - Finals' sous Gymnastique artistique (copier-coller probable dans la source) (non corrigé, à vérifier)
- gratuité CRD* non appliquée : source non vérifiée ('A_VERIFIER: URL du guide officiel du spectateur (annonce sur tickets.dakar2026.org)') dans overrides.json
- 8 horaire(s) de la billetterie affiché(s) à la place du PDF (fin inconnue, mention dans l'UI) : SWM05 : 11:00 dans le PDF, 10:00 sur la billetterie ; RU705 : 13:08 dans le PDF, 13:00 sur la billetterie ; SWM07 : 11:00 dans le PDF, 10:00 sur la billetterie ; SWM09 : 11:00 dans le PDF, 10:00 sur la billetterie ; ATH01 : 14:30 dans le PDF, 14:00 sur la billetterie ; ATH02 : 10:00 dans le PDF, 14:00 sur la billetterie ; ATH03 : 10:00 dans le PDF, 14:00 sur la billetterie ; BOX12 : 17:00 dans le PDF, 18:20 sur la billetterie
- billets sans session dans le PDF : FEN11 (Escrime (Fencing), 2026-11-13 09:00, Centre des Expositions de Dakar(Pavillon A))
- billetterie : aucun lien d'achat (tickets.purchaseUrlTemplate non renseigné) — l'UI renvoie vers la page programme avec le code
- billetterie : statuts non interprétés (tickets.statusMap non renseigné)

## Anomalies de la source (S1)

Texte source gardé tel quel dans `eventsRaw` ; corrections éventuelles dans `data/seed/overrides.json`.

- `BDM07` : coquille « quaterfinals » : "Women's and Men's singles - quaterfinals"
- `GAR101` : épreuve de skateboard (« Street ») sous Gymnastique artistique
- `BK301` : libellé générique « Women's and Men's singles » pour un sport collectif
- `BK302` : libellé générique « Women's and Men's singles » pour un sport collectif
- `BK303` : libellé générique « Women's and Men's singles » pour un sport collectif
- `BK304` : libellé générique « Women's and Men's singles » pour un sport collectif
- `BK305` : libellé générique « Women's and Men's singles » pour un sport collectif
- `BK306` : libellé générique « Women's and Men's singles » pour un sport collectif
- `ATH02` : épreuve en double : "Women's 400m Hurdles - semi & final"
- `BK307` : libellé générique « Women's and Men's singles » pour un sport collectif
- `BK308` : libellé générique « Women's and Men's singles » pour un sport collectif
- `HBB04` : libellé générique « Women's and Men's singles » pour un sport collectif
- `HBB05` : libellé générique « Women's and Men's singles » pour un sport collectif
- `HBB06` : libellé générique « Women's and Men's singles » pour un sport collectif
- `BOX11` : abréviation « M's » au lieu de « Men's » : "M's 50kg - Final"
- `HBB07` : libellé générique « Women's and Men's singles » pour un sport collectif
- `HBB08` : parenthèse non fermée : "Women's and Men's singles - Finals (Bronze and Gold"
- `HBB08` : libellé générique « Women's and Men's singles » pour un sport collectif
- `JUD01` : « Men - 55kg - Preliminary Rounds » — espace entre le tiret et le poids (catégorie -55 kg ?) : affiché « 55 kg », non corrigé
- `JUD02` : « Men - 55kg - Final Block » — espace entre le tiret et le poids (catégorie -55 kg ?) : affiché « 55 kg », non corrigé

## Épreuves gardées en anglais

Aucune.

## Sessions sans lien billetterie (44)

`BS501`, `BS502`, `BS503`, `VBV01`, `RCB01`, `TTE01`, `VBV02`, `BDM01`, `TTE02`, `WST01`, `FBS01`, `JUD01`, `RCB02`, `BS504`, `RU701`, `SWM01`, `RU702`, `BDM02`, `TTE03`, `WST02`, `BS505`, `SWM02`, `FBS02`, `JUD02`, `BDM03`, `WST03`, `FBS03`, `JUD03`, `TTE04`, `BS506`, `SWM03`, `RU703`, `BDM04`, `TTE05`, `WST04`, `BS507`, `SWM04`, `FBS04`, `JUD04`, `GAR100`, `GAR101`, `GAR102`, `GAR103`, `GAR104`

## Billets groupés (jointure site + jour)

- 2026-11-02 · saly-plage-ouest : VBV03, RCB03, VBV04
- 2026-11-03 · saly-plage-ouest : VBV05, RCB04
- 2026-11-04 · saly-plage-ouest : VBV06
- 2026-11-05 · saly-plage-ouest : TRI01
- 2026-11-06 · saly-plage-ouest : TRI02
- 2026-11-07 · saly-plage-ouest : WRB01, WRB02
- 2026-11-08 · saly-plage-ouest : WRB03, SAL01, WRB04
- 2026-11-09 · saly-plage-ouest : HBB01, SAL02, HBB02
- 2026-11-10 · saly-plage-ouest : HBB03, SAL03
- 2026-11-11 · saly-plage-ouest : HBB04, SAL04, HBB05
- 2026-11-12 · saly-plage-ouest : HBB06, SAL05, HBB07
- 2026-11-13 · saly-plage-ouest : HBB08

## Sites

- Sans note d'accès (8) : tour-de-l-oeuf, iba-mar-diop, corniche-ouest, dakar-arena, dakar-expo-centre, centre-equestre, stade-abdoulaye-wade, saly-plage-ouest
- Sans coordonnées GPS vérifiées (8) : tour-de-l-oeuf, iba-mar-diop, corniche-ouest, dakar-arena, dakar-expo-centre, centre-equestre, stade-abdoulaye-wade, saly-plage-ouest

## Contrôle humain — 10 sessions tirées au hasard (graine 20261102)

À comparer ligne à ligne avec le PDF (numéro de page indiqué).

- [ ] **FEN05** — p. 7 — jour 10 09:00–12:35 — Dakar Expo Centre — Women's Épée Individual - Pool Round, Table of 16, Table of 8
- [ ] **RU702** — p. 1 — jour 1 13:14–17:26 — Complexe Iba Mar Diop — Men - Pool Round
- [ ] **BK303** — p. 4 — jour 7 10:00–12:40 — Complexe Tour de l'Oeuf — Women's and Men's singles - Pool Round
- [ ] **TKW07** — p. 8 — jour 11 11:00–14:36 — Complexe Iba Mar Diop — Women +63kg - Elimination Round of 16, Quarterfinals / Men -73kg - Elimination Round of 16, Quarterfinals / Men +73kg - Elimination Round of 16, Quarterfinals
- [ ] **FEN08** — p. 8 — jour 11 14:00–16:05 — Dakar Expo Centre — Men's Épée Individual - Semifinals, Finals
- [ ] **FBS04** — p. 2 — jour 2 15:30–19:30 — Complexe Iba Mar Diop — Men's PAN vs AFG / Men's SEN vs ARG
- [ ] **BS506** — p. 2 — jour 2 10:30–13:15 — Complexe Tour de l'Oeuf — Quarterfinals
- [ ] **BOX02** — p. 4 — jour 7 17:00–19:30 — Dakar Expo Centre — Women's 51kg - Preliminaries / Women's 57kg - Preliminaries / Men's 55kg - Preliminaries / Men's 65kg - Preliminaries / Men's 70kg - Preliminaries
- [ ] **JUD01** — p. 1 — jour 1 10:00–12:30 — Dakar Expo Centre — Men - 55kg - Preliminary Rounds / Women -44kg - Preliminary Rounds / Men -66kg - Preliminary Rounds
- [ ] **HBB05** — p. 8 — jour 11 15:30–17:10 — Saly Beach West — Women's and Men's singles - Placement Matches (5-8)

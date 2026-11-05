# Rapport de validation — 2026-11-05T13:15+00:00

**✅ OK** — 0 erreur(s), 5 avertissement(s). Données générées le 2026-11-05T13:15:25+00:00.

## Compteurs

- Sessions : 207 (185 sportives, 22 Fan)
- Billetterie : code 107 · site+jour 20 · aucun 80
- Gratuites : 20 · Finales : 56

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
- GAR101 : Épreuve 'Men's Street - Finals' sous Gymnastique artistique (copier-coller probable dans la source) (non corrigé, à vérifier)
- 4 horaire(s) de la billetterie affiché(s) à la place du PDF (fin inconnue, mention dans l'UI) : ATH01 : 14:30 dans le PDF, 14:00 sur la billetterie ; ATH02 : 10:00 dans le PDF, 14:00 sur la billetterie ; ATH03 : 10:00 dans le PDF, 14:00 sur la billetterie ; BOX12 : 17:00 dans le PDF, 18:20 sur la billetterie
- billets sans session dans le PDF : FEN11 (Escrime (Fencing), 2026-11-13 09:00, Centre des Expositions de Dakar(Pavillon A))
- billetterie : aucun lien d'achat profond (connexion obligatoire sur la billetterie, voir tickets._purchaseUrlTemplate) — l'UI renvoie vers la page programme avec le code

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

## Sessions sans lien billetterie (80)

`BS501`, `BS502`, `BS503`, `VBV01`, `RCB01`, `TTE01`, `VBV02`, `BDM01`, `TTE02`, `WST01`, `FBS01`, `JUD01`, `RCB02`, `BS504`, `RU701`, `SWM01`, `RU702`, `BDM02`, `TTE03`, `WST02`, `BS505`, `SWM02`, `FBS02`, `JUD02`, `BDM03`, `VBV03`, `WST03`, `FBS03`, `JUD03`, `RCB03`, `TTE04`, `BS506`, `SWM03`, `RU703`, `VBV04`, `BDM04`, `TTE05`, `WST04`, `BS507`, `SWM04`, `FBS04`, `JUD04`, `BDM05`, `EQU01`, `VBV05`, `WST05`, `RU704`, `FBS05`, `JUD05`, `RCB04`, `TTE06`, `BS508`, `SWM05`, `RU705`, `TTE07`, `BDM06`, `WST06`, `BS509`, `SWM06`, `FBS06`, `JUD06`, `BDM07`, `FBS07`, `TTE08`, `SWM07`, `VBV06`, `SKB01`, `BDM08`, `SWM08`, `TTE09`, `FBS08`, `SKB02`, `EQU02`, `FBS09`, `GAR100`, `TTE10`, `GAR101`, `GAR102`, `GAR103`, `GAR104`

## Billets groupés (jointure site + jour)

- 2026-11-05 · saly-plage-ouest : TRI01
- 2026-11-05 · tour-de-l-oeuf : SWM09
- 2026-11-06 · saly-plage-ouest : TRI02
- 2026-11-07 · saly-plage-ouest : WRB01, WRB02
- 2026-11-08 · saly-plage-ouest : WRB03, SAL01, WRB04
- 2026-11-09 · saly-plage-ouest : HBB01, SAL02, HBB02
- 2026-11-10 · saly-plage-ouest : HBB03, SAL03
- 2026-11-11 · saly-plage-ouest : HBB04, SAL04, HBB05
- 2026-11-12 · saly-plage-ouest : HBB06, SAL05, HBB07
- 2026-11-13 · saly-plage-ouest : HBB08

## Sites

- Sans note d'accès (0) : —
- Sans coordonnées GPS vérifiées (0) : —

## Contrôle humain — 10 sessions tirées au hasard (graine 20261105)

À comparer ligne à ligne avec le PDF (numéro de page indiqué).

- [ ] **SWM03** — p. 2 — jour 2 11:00–13:00 — Complexe Tour de l'Oeuf — Women's 100m Freestyle - Heats / Men's 100m Freestyle - Heats / Women's 200m Breaststroke - Heats / Men's 200m Breaststroke - Heats
- [ ] **TKW09** — p. 8 — jour 12 11:00–12:40 — Complexe Iba Mar Diop — Mixed Team - Quarterfinals
- [ ] **BS507** — p. 2 — jour 2 15:00–17:45 — Complexe Tour de l'Oeuf — Semifinals
- [ ] **FEN06** — p. 7 — jour 10 14:00–16:05 — Dakar Expo Centre — Women's Épée Individual - Semifinals, Finals
- [ ] **VBV03** — p. 2 — jour 2 09:00–11:00 — Saly Beach West — Women and Men - Lucky Loser Round
- [ ] **FBS12** — p. 4 — jour 7 15:30–19:30 — Dakar Arena — Men's ARG vs PAN / Men's AFG vs SEN
- [ ] **BOX08** — p. 7 — jour 10 17:00–20:00 — Dakar Expo Centre — Women's 48kg - Preliminaries / Women's 54kg - Preliminaries / Women's 60kg - Preliminaries
- [ ] **BOX09** — p. 8 — jour 11 12:00–14:30 — Dakar Expo Centre — Women's 51kg - Semifinals / Women's 57kg - Semifinals / Men's 50kg - Semifinals / Men's 60kg - Semifinals / Men's 70kg - Semifinals
- [ ] **EQU01** — p. 3 — jour 3 09:00–10:30 — Equestrian Centre — Jumping Individual - Qualifier Round A
- [ ] **FEN01** — p. 5 — jour 8 09:00–12:35 — Dakar Expo Centre — Women's Foil Individual - Pool Round, Table of 16, Table of 8

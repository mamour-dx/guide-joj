# Rapport de validation — 2026-11-10T13:28+00:00

**✅ OK** — 0 erreur(s), 5 avertissement(s). Données générées le 2026-11-10T13:28:07+00:00.

## Compteurs

- Sessions : 193 (185 sportives, 8 Fan)
- Billetterie : code 34 · site+jour 10 · aucun 149
- Gratuites : 10 · Finales : 56

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
- 2 horaire(s) de la billetterie affiché(s) à la place du PDF (fin inconnue, mention dans l'UI) : ATH03 : 10:00 dans le PDF, 14:00 sur la billetterie ; BOX12 : 17:00 dans le PDF, 18:20 sur la billetterie
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

## Sessions sans lien billetterie (149)

`BS501`, `BS502`, `BS503`, `VBV01`, `RCB01`, `TTE01`, `VBV02`, `BDM01`, `TTE02`, `WST01`, `FBS01`, `JUD01`, `RCB02`, `BS504`, `RU701`, `SWM01`, `RU702`, `BDM02`, `TTE03`, `WST02`, `BS505`, `SWM02`, `FBS02`, `JUD02`, `BDM03`, `VBV03`, `WST03`, `FBS03`, `JUD03`, `RCB03`, `TTE04`, `BS506`, `SWM03`, `RU703`, `VBV04`, `BDM04`, `TTE05`, `WST04`, `BS507`, `SWM04`, `FBS04`, `JUD04`, `BDM05`, `EQU01`, `VBV05`, `WST05`, `RU704`, `FBS05`, `JUD05`, `RCB04`, `TTE06`, `BS508`, `SWM05`, `RU705`, `TTE07`, `BDM06`, `WST06`, `BS509`, `SWM06`, `FBS06`, `JUD06`, `BDM07`, `FBS07`, `TTE08`, `SWM07`, `VBV06`, `SKB01`, `BDM08`, `SWM08`, `TTE09`, `FBS08`, `SKB02`, `EQU02`, `TRI01`, `FBS09`, `GAR100`, `TTE10`, `SWM09`, `SKB03`, `GAR101`, `BDM09`, `SWM10`, `FBS10`, `SKB04`, `TTE11`, `EQU03`, `TRI02`, `ARC01`, `BK301`, `GAR102`, `SWM11`, `GAR103`, `GAR104`, `BK302`, `SWM12`, `ARC02`, `BK303`, `FBS11`, `GAR01`, `WRB01`, `BOX01`, `ARC03`, `GAR02`, `BK304`, `WRB02`, `FBS12`, `BOX02`, `CRD01`, `FEN01`, `ARC04`, `GAR03`, `WRB03`, `FBS13`, `TKW01`, `BK305`, `BOX03`, `SAL01`, `ARC05`, `FEN02`, `ATH01`, `BK306`, `FBS14`, `WRB04`, `GAR04`, `TKW02`, `BOX04`, `FEN03`, `HBB01`, `ARC06`, `ATH02`, `GAR05`, `FBS15`, `TKW03`, `BK307`, `BOX05`, `SAL02`, `ARC07`, `FEN04`, `BK308`, `FBS16`, `HBB02`, `TKW04`, `BOX06`, `GAR06`, `CRD02`, `FEN05`, `TKW05`, `GAR07`, `BOX07`

## Billets groupés (jointure site + jour)

- 2026-11-10 · stade-abdoulaye-wade : ARC08
- 2026-11-10 · saly-plage-ouest : HBB03, SAL03
- 2026-11-11 · saly-plage-ouest : HBB04, SAL04, HBB05
- 2026-11-12 · saly-plage-ouest : HBB06, SAL05, HBB07
- 2026-11-13 · saly-plage-ouest : HBB08

## Sites

- Sans note d'accès (0) : —
- Sans coordonnées GPS vérifiées (0) : —

## Contrôle humain — 10 sessions tirées au hasard (graine 20261110)

À comparer ligne à ligne avec le PDF (numéro de page indiqué).

- [ ] **TTE10** — p. 4 — jour 5 10:00–13:00 — Dakar Expo Centre — Women's Single - Semifinals / Men's Single - Semifinals
- [ ] **FBS18** — p. 8 — jour 11 15:00–17:50 — Dakar Arena — Women's Final
- [ ] **VBV05** — p. 3 — jour 3 09:00–17:00 — Saly Beach West — Women and Men - Quarter and Semifinals
- [ ] **CRD02** — p. 7 — jour 10 09:00–12:04 — Corniche West — Women's Individual Time Trial - Final / Men's Individual Time Trial - Final
- [ ] **HBB08** — p. 8 — jour 13 09:30–13:51 — Saly Beach West — Women's and Men's singles - Finals (Bronze and Gold
- [ ] **BK306** — p. 5 — jour 8 15:00–16:40 — Complexe Tour de l'Oeuf — Women's and Men's singles - Quarterfinals
- [ ] **GAR09** — p. 8 — jour 11 17:00–19:05 — Dakar Expo Centre — Mixed Team - final
- [ ] **ARC02** — p. 4 — jour 7 09:00–12:44 — Stade Abdoulaye Wade — Women's and Men's singles - 1/16 Elimination Round
- [ ] **SWM10** — p. 4 — jour 5 15:00–17:00 — Complexe Tour de l'Oeuf — Women's 50m Backstroke - Final / Men's 50m Backstroke - Final / Women's 50m Breaststroke - Final / Men's 50m Breaststroke - Final
- [ ] **RU704** — p. 3 — jour 3 09:40–11:08 — Complexe Iba Mar Diop — Women - Pool Round

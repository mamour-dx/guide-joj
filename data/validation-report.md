# Rapport de validation — 2026-11-04T13:02+00:00

**✅ OK** — 0 erreur(s), 5 avertissement(s). Données générées le 2026-11-04T13:02:25+00:00.

## Compteurs

- Sessions : 209 (185 sportives, 24 Fan)
- Billetterie : code 119 · site+jour 21 · aucun 69
- Gratuites : 22 · Finales : 56

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
- 5 horaire(s) de la billetterie affiché(s) à la place du PDF (fin inconnue, mention dans l'UI) : SWM09 : 11:00 dans le PDF, 10:00 sur la billetterie ; ATH01 : 14:30 dans le PDF, 14:00 sur la billetterie ; ATH02 : 10:00 dans le PDF, 14:00 sur la billetterie ; ATH03 : 10:00 dans le PDF, 14:00 sur la billetterie ; BOX12 : 17:00 dans le PDF, 18:20 sur la billetterie
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

## Sessions sans lien billetterie (69)

`BS501`, `BS502`, `BS503`, `VBV01`, `RCB01`, `TTE01`, `VBV02`, `BDM01`, `TTE02`, `WST01`, `FBS01`, `JUD01`, `RCB02`, `BS504`, `RU701`, `SWM01`, `RU702`, `BDM02`, `TTE03`, `WST02`, `BS505`, `SWM02`, `FBS02`, `JUD02`, `BDM03`, `VBV03`, `WST03`, `FBS03`, `JUD03`, `RCB03`, `TTE04`, `BS506`, `SWM03`, `RU703`, `VBV04`, `BDM04`, `TTE05`, `WST04`, `BS507`, `SWM04`, `FBS04`, `JUD04`, `BDM05`, `EQU01`, `VBV05`, `WST05`, `RU704`, `FBS05`, `JUD05`, `RCB04`, `TTE06`, `BS508`, `SWM05`, `RU705`, `TTE07`, `BDM06`, `WST06`, `BS509`, `SWM06`, `FBS06`, `JUD06`, `BDM07`, `FBS07`, `TTE08`, `GAR100`, `GAR101`, `GAR102`, `GAR103`, `GAR104`

## Billets groupés (jointure site + jour)

- 2026-11-04 · tour-de-l-oeuf : SWM07
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

- Sans note d'accès (0) : —
- Sans coordonnées GPS vérifiées (0) : —

## Contrôle humain — 10 sessions tirées au hasard (graine 20261104)

À comparer ligne à ligne avec le PDF (numéro de page indiqué).

- [ ] **TKW07** — p. 8 — jour 11 11:00–14:36 — Complexe Iba Mar Diop — Women +63kg - Elimination Round of 16, Quarterfinals / Men -73kg - Elimination Round of 16, Quarterfinals / Men +73kg - Elimination Round of 16, Quarterfinals
- [ ] **RU705** — p. 3 — jour 3 13:08–17:50 — Complexe Iba Mar Diop — Women - Placing 5-8 / Women - Semifinals / Women - Finals
- [ ] **FBS10** — p. 4 — jour 5 15:30–19:30 — Complexe Iba Mar Diop — Women's FIJ vs VEN / Women's UKR vs SEN
- [ ] **SWM12** — p. 4 — jour 6 15:30–17:30 — Complexe Tour de l'Oeuf — Women's 200m Freestyle - Final / Men's 200m Freestyle - Final / Women's 200m Butterfly - Final / Men's 200m Butterfly - Final
- [ ] **HBB01** — p. 6 — jour 9 09:30–12:50 — Saly Beach West — W FRA vs SEN ; W URU vs KEN / M TUN vs COK ; M GER vs THA / W CRO vs MEX ; W ESP vs CHN
- [ ] **SAL03** — p. 7 — jour 10 12:00–17:30 — Saly Beach West — Women's and Men's R7, R8 and R9
- [ ] **TTE01** — p. 1 — jour 0 10:00–13:00 — Dakar Expo Centre — Mixed Doubles - Round of 32 / Mixed Doubles - Round of 16
- [ ] **SWM06** — p. 3 — jour 3 15:00–17:00 — Complexe Tour de l'Oeuf — Women's 800m Freestyle - Fastest Heat / Men's 400m Freestyle - Fastest Heat / Women's 100m Backstroke - Final / Men's 100m Backstroke - Final / Women's 100m Breaststroke - Final / Men's 100m Breaststroke - Final
- [ ] **WRB01** — p. 4 — jour 7 10:30–12:30 — Saly Beach West — Women 55kg - Group Stage Rounds / Women 75kg - Group Stage Rounds / Men 60kg - Group Stage Rounds / Men 80kg - Group Stage Rounds
- [ ] **BS502** — p. 1 — jour -1 15:00–17:45 — Complexe Tour de l'Oeuf — MEX vs SYR / FRA vs KEN

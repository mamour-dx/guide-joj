# Rapport de validation — 2026-11-13T13:06+00:00

**✅ OK** — 0 erreur(s), 3 avertissement(s). Données générées le 2026-11-13T13:06:38+00:00.

## Compteurs

- Sessions : 188 (185 sportives, 3 Fan)
- Billetterie : code 3 · site+jour 2 · aucun 183
- Gratuites : 6 · Finales : 56

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

## Sessions sans lien billetterie (183)

`BS501`, `BS502`, `BS503`, `VBV01`, `RCB01`, `TTE01`, `VBV02`, `BDM01`, `TTE02`, `WST01`, `FBS01`, `JUD01`, `RCB02`, `BS504`, `RU701`, `SWM01`, `RU702`, `BDM02`, `TTE03`, `WST02`, `BS505`, `SWM02`, `FBS02`, `JUD02`, `BDM03`, `VBV03`, `WST03`, `FBS03`, `JUD03`, `RCB03`, `TTE04`, `BS506`, `SWM03`, `RU703`, `VBV04`, `BDM04`, `TTE05`, `WST04`, `BS507`, `SWM04`, `FBS04`, `JUD04`, `BDM05`, `EQU01`, `VBV05`, `WST05`, `RU704`, `FBS05`, `JUD05`, `RCB04`, `TTE06`, `BS508`, `SWM05`, `RU705`, `TTE07`, `BDM06`, `WST06`, `BS509`, `SWM06`, `FBS06`, `JUD06`, `BDM07`, `FBS07`, `TTE08`, `SWM07`, `VBV06`, `SKB01`, `BDM08`, `SWM08`, `TTE09`, `FBS08`, `SKB02`, `EQU02`, `TRI01`, `FBS09`, `GAR100`, `TTE10`, `SWM09`, `SKB03`, `GAR101`, `BDM09`, `SWM10`, `FBS10`, `SKB04`, `TTE11`, `EQU03`, `TRI02`, `ARC01`, `BK301`, `GAR102`, `SWM11`, `GAR103`, `GAR104`, `BK302`, `SWM12`, `ARC02`, `BK303`, `FBS11`, `GAR01`, `WRB01`, `BOX01`, `ARC03`, `GAR02`, `BK304`, `WRB02`, `FBS12`, `BOX02`, `CRD01`, `FEN01`, `ARC04`, `GAR03`, `WRB03`, `FBS13`, `TKW01`, `BK305`, `BOX03`, `SAL01`, `ARC05`, `FEN02`, `ATH01`, `BK306`, `FBS14`, `WRB04`, `GAR04`, `TKW02`, `BOX04`, `FEN03`, `HBB01`, `ARC06`, `ATH02`, `GAR05`, `FBS15`, `TKW03`, `BK307`, `BOX05`, `SAL02`, `ARC07`, `FEN04`, `BK308`, `FBS16`, `HBB02`, `TKW04`, `BOX06`, `GAR06`, `CRD02`, `FEN05`, `ARC08`, `ATH03`, `HBB03`, `TKW05`, `GAR07`, `BOX07`, `SAL03`, `ARC09`, `FEN06`, `TKW06`, `GAR08`, `BOX08`, `FEN07`, `HBB04`, `FBS17`, `TKW07`, `BOX09`, `SAL04`, `FEN08`, `FBS18`, `HBB05`, `TKW08`, `BOX10`, `GAR09`, `HBB06`, `FEN09`, `BKG01`, `FBS19`, `TKW09`, `BOX11`, `SAL05`, `FEN10`, `BKG02`, `FBS20`, `TKW10`, `HBB07`, `BOX12`

## Billets groupés (jointure site + jour)

- 2026-11-13 · saly-plage-ouest : HBB08
- 2026-11-13 · tour-de-l-oeuf : BKG03

## Sites

- Sans note d'accès (0) : —
- Sans coordonnées GPS vérifiées (0) : —

## Contrôle humain — 10 sessions tirées au hasard (graine 20261113)

À comparer ligne à ligne avec le PDF (numéro de page indiqué).

- [ ] **WST05** — p. 3 — jour 3 09:00–12:00 — Dakar Expo Centre — Men's Changquan - Final / Women's Gunshu - Final / Men's Taijiquan - Final / Women's Taijishan - Final
- [ ] **RCB01** — p. 1 — jour 0 10:00–12:10 — Saly Beach West — Mixed Double Sculls - Time Trial 1 / Men's Solo - Time Trial 1 / Women's Solo - Time Trial 1
- [ ] **RU703** — p. 2 — jour 2 11:30–17:49 — Complexe Iba Mar Diop — Women - Pool Round / Men - Placing 5-8 / Men - Semifinals / Men - Finals
- [ ] **BK302** — p. 4 — jour 6 15:00–17:40 — Complexe Tour de l'Oeuf — Women's and Men's singles - Pool Round
- [ ] **SAL04** — p. 8 — jour 11 12:00–17:30 — Saly Beach West — Women's and Men's R10, R11 and R12
- [ ] **BS503** — p. 1 — jour 0 08:30–14:15 — Complexe Tour de l'Oeuf — TPE vs TUR / SYR vs FRA / MEX vs KEN / SEN vs CUB
- [ ] **ARC05** — p. 5 — jour 8 14:00–16:30 — Stade Abdoulaye Wade — Men's Quarterfinals / Men's Semifinals / Men's Finals (Bronze and Gold)
- [ ] **RU702** — p. 1 — jour 1 13:14–17:26 — Complexe Iba Mar Diop — Men - Pool Round
- [ ] **FBS15** — p. 6 — jour 9 11:00–13:30 — Dakar Arena — Men's Winner B vs Runner-up A
- [ ] **BDM03** — p. 2 — jour 2 09:00–12:40 — Dakar Arena — Women's and Men's singles - group stage

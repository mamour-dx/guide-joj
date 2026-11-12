# Rapport de validation — 2026-11-12T13:46+00:00

**✅ OK** — 0 erreur(s), 4 avertissement(s). Données générées le 2026-11-12T13:46:45+00:00.

## Compteurs

- Sessions : 190 (185 sportives, 5 Fan)
- Billetterie : code 11 · site+jour 5 · aucun 174
- Gratuites : 8 · Finales : 56

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

## Sessions sans lien billetterie (174)

`BS501`, `BS502`, `BS503`, `VBV01`, `RCB01`, `TTE01`, `VBV02`, `BDM01`, `TTE02`, `WST01`, `FBS01`, `JUD01`, `RCB02`, `BS504`, `RU701`, `SWM01`, `RU702`, `BDM02`, `TTE03`, `WST02`, `BS505`, `SWM02`, `FBS02`, `JUD02`, `BDM03`, `VBV03`, `WST03`, `FBS03`, `JUD03`, `RCB03`, `TTE04`, `BS506`, `SWM03`, `RU703`, `VBV04`, `BDM04`, `TTE05`, `WST04`, `BS507`, `SWM04`, `FBS04`, `JUD04`, `BDM05`, `EQU01`, `VBV05`, `WST05`, `RU704`, `FBS05`, `JUD05`, `RCB04`, `TTE06`, `BS508`, `SWM05`, `RU705`, `TTE07`, `BDM06`, `WST06`, `BS509`, `SWM06`, `FBS06`, `JUD06`, `BDM07`, `FBS07`, `TTE08`, `SWM07`, `VBV06`, `SKB01`, `BDM08`, `SWM08`, `TTE09`, `FBS08`, `SKB02`, `EQU02`, `TRI01`, `FBS09`, `GAR100`, `TTE10`, `SWM09`, `SKB03`, `GAR101`, `BDM09`, `SWM10`, `FBS10`, `SKB04`, `TTE11`, `EQU03`, `TRI02`, `ARC01`, `BK301`, `GAR102`, `SWM11`, `GAR103`, `GAR104`, `BK302`, `SWM12`, `ARC02`, `BK303`, `FBS11`, `GAR01`, `WRB01`, `BOX01`, `ARC03`, `GAR02`, `BK304`, `WRB02`, `FBS12`, `BOX02`, `CRD01`, `FEN01`, `ARC04`, `GAR03`, `WRB03`, `FBS13`, `TKW01`, `BK305`, `BOX03`, `SAL01`, `ARC05`, `FEN02`, `ATH01`, `BK306`, `FBS14`, `WRB04`, `GAR04`, `TKW02`, `BOX04`, `FEN03`, `HBB01`, `ARC06`, `ATH02`, `GAR05`, `FBS15`, `TKW03`, `BK307`, `BOX05`, `SAL02`, `ARC07`, `FEN04`, `BK308`, `FBS16`, `HBB02`, `TKW04`, `BOX06`, `GAR06`, `CRD02`, `FEN05`, `ARC08`, `ATH03`, `HBB03`, `TKW05`, `GAR07`, `BOX07`, `SAL03`, `ARC09`, `FEN06`, `TKW06`, `GAR08`, `BOX08`, `FEN07`, `HBB04`, `FBS17`, `TKW07`, `BOX09`, `SAL04`, `FEN08`, `FBS18`, `HBB05`, `TKW08`, `BOX10`, `GAR09`, `FEN09`, `FBS19`, `TKW09`, `BOX11`

## Billets groupés (jointure site + jour)

- 2026-11-12 · saly-plage-ouest : HBB06, SAL05, HBB07
- 2026-11-12 · tour-de-l-oeuf : BKG01
- 2026-11-13 · saly-plage-ouest : HBB08

## Sites

- Sans note d'accès (0) : —
- Sans coordonnées GPS vérifiées (0) : —

## Contrôle humain — 10 sessions tirées au hasard (graine 20261112)

À comparer ligne à ligne avec le PDF (numéro de page indiqué).

- [ ] **RU705** — p. 3 — jour 3 13:08–17:50 — Complexe Iba Mar Diop — Women - Placing 5-8 / Women - Semifinals / Women - Finals
- [ ] **ATH02** — p. 6 — jour 9 10:00–14:37 — Complexe Iba Mar Diop — Women's Javelin Throw - final / Men's 2000m Steeplechase - final / Women's 3000m - final / Men's Shot Put - final / Men's 800m - semi-final / Men's 400m Hurdles - semi & final / Men's High Jump - final / Women's 400m Hurdles - semi & final / Men's Discus Throw - final / Women's 400m Hurdles - semi & final / Women's Long Jump - final / Men's 1500m - final / Men's 110m Hurdles - semi & final / Women's 400m - final / Men's 400m - final / Women's 800m - final
- [ ] **SWM05** — p. 3 — jour 3 11:00–13:00 — Complexe Tour de l'Oeuf — Women's 100m Backstroke - Heats / Men's 100m Backstroke - Heats / Women's 100m Breaststroke - Heats / Men's 100m Breaststroke - Heats / Women's 800m Freestyle - Slowest Heats / Men's 400m Freestyle - Slowest Heats
- [ ] **FBS11** — p. 4 — jour 7 10:00–14:00 — Dakar Arena — Men's PAR vs POR / Men's MAR vs SOL
- [ ] **TTE08** — p. 3 — jour 4 10:00–13:15 — Dakar Expo Centre — Women's Single - Quarterfinals / Men's Single - Quarterfinals
- [ ] **FEN06** — p. 7 — jour 10 14:00–16:05 — Dakar Expo Centre — Women's Épée Individual - Semifinals, Finals
- [ ] **RCB03** — p. 2 — jour 2 10:00–13:10 — Saly Beach West — Men's Solo - Last 16 / Women's Solo - Last 16 / Mixed Double Sculls - Last 8
- [ ] **FBS07** — p. 3 — jour 4 10:00–14:00 — Complexe Iba Mar Diop — Men's POR vs SOL / Men's PAR vs MAR
- [ ] **WRB03** — p. 5 — jour 8 10:30–12:30 — Saly Beach West — Women 45kg - Group Stage Rounds / Women 65kg - Group Stage Rounds / Men 70kg - Group Stage Rounds / Men 90kg - Group Stage Rounds
- [ ] **SWM11** — p. 4 — jour 6 10:00–12:30 — Complexe Tour de l'Oeuf — Women's 200m Freestyle - Heats / Men's 200m Freestyle - Heats / Women's 200m Butterfly - Heats / Men's 200m Butterfly - Heats

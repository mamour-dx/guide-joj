# Modèle de données

Les fichiers de `data/` sont la **seule** interface entre l'ingestion (Python) et le site
(Next.js). Les schémas zod ci-dessous sont la référence : `src/lib/schema.ts` doit les
reprendre tels quels, et `scripts/` doit produire exactement ça (miroir en pydantic).

```ts
import { z } from "zod";

export const Cluster = z.enum(["dakar", "diamniadio", "saly"]);

export const Venue = z.object({
  id: z.string(),                       // "dakar-expo-centre"
  name: z.string(),                     // nom affiché en français
  cluster: Cluster,
  aliases: z.array(z.string()).min(1),  // tous les noms vus dans les sources
  lat: z.number().nullable(),           // null tant que non vérifié à la main
  lng: z.number().nullable(),
  mapsQuery: z.string(),                // texte pour lien Google Maps si lat/lng null
  accessNote: z.string().nullable(),    // depuis le guide mobilité (S3), cité
  accessSourceUrl: z.string().url().nullable(),
});

export const Sport = z.object({
  id: z.string(),                       // "athletics"
  codePrefix: z.string(),               // "ATH"
  nameFr: z.string(),                   // "Athlétisme"
  nameEn: z.string(),                   // "Athletics" (tel qu'écrit dans le PDF)
  emoji: z.string(),                    // icône simple, pas de pictogramme officiel
});

export const Session = z.object({
  id: z.string(),                       // = code session, ex. "ATH01"
  kind: z.enum(["sport", "fan"]),
  sportId: z.string().nullable(),       // null pour kind = "fan"
  title: z.string().nullable(),         // pour kind = "fan" (ex. "Pass Fan Zone")
  venueId: z.string(),
  hall: z.string().nullable(),          // ex. "Pavillon C"
  start: z.string().datetime({ offset: true }),  // "2026-11-08T14:30:00+00:00"
  end: z.string().datetime({ offset: true }).nullable(), // null : kind = "fan" (fin non publiée)
                                        // ou horaire corrigé par la billetterie (voir scheduleConflict)
  day: z.number().int(),                // numéro de jour officiel (-1 … 13)
  events: z.array(z.string()),          // épreuves nettoyées
  eventsRaw: z.array(z.string()),       // texte source, intouché
  hasFinal: z.boolean(),
  isFree: z.boolean().nullable(),       // true / null(= voir billetterie). Jamais false par défaut.
  freeSource: z.string().url().nullable(),
  ticketUrl: z.string().url().nullable(),
  ticketMatch: z.enum(["code", "venue-day", "none"]),
  ticketStatus: z.enum(["available", "limited", "soldout", "cancelled", "unknown"]),
  sourceUrl: z.string().url(),          // S1 pour les sessions sportives
  // Horaire du PDF ≠ horaire de la billetterie : on affiche la billetterie (plus récente) et
  // on garde le PDF ici pour la mention « horaire modifié, à vérifier ». null sinon.
  scheduleConflict: z.object({
    pdfStart: z.string().datetime({ offset: true }),
    pdfEnd: z.string().datetime({ offset: true }),
    ticketStart: z.string().datetime({ offset: true }),
  }).nullable(),
});

export const Meta = z.object({
  generatedAt: z.string().datetime({ offset: true }),
  sources: z.array(z.object({
    id: z.string(), url: z.string().url(), sha256: z.string(), fetchedAt: z.string(),
  })),
  counts: z.object({ sessions: z.number(), venues: z.number(), sports: z.number() }),
  warnings: z.array(z.string()),
});
```

## Exemple réel (tiré du PDF, jour 8)

```json
{
  "id": "CRD01",
  "kind": "sport",
  "sportId": "cycling-road",
  "title": null,
  "venueId": "corniche-ouest",
  "hall": null,
  "start": "2026-11-08T09:00:00+00:00",
  "end": "2026-11-08T13:29:00+00:00",
  "day": 8,
  "events": ["Course sur route femmes — finale", "Course sur route hommes — finale"],
  "eventsRaw": ["Women's Road Race - Final", "Men's Road Race - Final"],
  "hasFinal": true,
  "isFree": true,
  "freeSource": "<URL du guide de billetterie, voir sources.json>",
  "ticketUrl": null,
  "ticketMatch": "none",
  "ticketStatus": "unknown",
  "sourceUrl": "<URL du PDF programme, voir sources.json>",
  "scheduleConflict": null
}
```

## Traduction des épreuves

`events` est en français, `eventsRaw` reste en anglais. Traduction **par règles** (pas par
IA à la volée) dans `scripts/translate_events.py`, avec un dictionnaire :
`Women's` → `femmes`, `Men's` → `hommes`, `Mixed` → `mixte`, `Heats` → `séries`,
`Final` → `finale`, `Semifinals` → `demi-finales`, `Quarterfinals` → `quarts de finale`,
`Preliminary Round(s)` → `tour préliminaire`, `Pool Round` → `phase de poules`,
`Bronze Medal Game` → `match pour le bronze`, etc. Les noms de pays en code CIO
(`SEN vs ARG`) restent tels quels ; on ajoute un drapeau emoji si le code est connu.
Si une épreuve ne se traduit pas proprement : garder l'anglais (mieux que faux).

## Fichiers seed (écrits à la main, dans `data/seed/`)

- `venues.json` — les 8 sites, secteurs et alias (lat/lng à compléter **après
  vérification** sur Google Maps).
- `sports.json` — 25 préfixes de code → sport.
- `sources.json` — URLs officielles.
- `overrides.json` — gratuité, événements Fan, corrections d'anomalies (toujours avec une
  raison et une source).

// Schémas de docs/DATA_MODEL.md, repris tels quels. Le build échoue si data/*.json est invalide.
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

export type Cluster = z.infer<typeof Cluster>;
export type Venue = z.infer<typeof Venue>;
export type Sport = z.infer<typeof Sport>;
export type Session = z.infer<typeof Session>;
export type Meta = z.infer<typeof Meta>;

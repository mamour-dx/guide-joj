// Chargement des données au build, validées par zod : un JSON invalide fait échouer le build.
// Module serveur uniquement (il embarque tous les JSON).
import { z } from "zod";
import sessionsJson from "../../data/sessions.json";
import venuesJson from "../../data/venues.json";
import sportsJson from "../../data/sports.json";
import metaJson from "../../data/meta.json";
import sourcesJson from "../../data/seed/sources.json";
import { Meta, Session, Sport, Venue } from "./schema";
import { normalize, type CardData } from "./cards";
import { dayKey } from "./time";

function parse<T>(schema: z.ZodType<T>, data: unknown, file: string): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    throw new Error(`data/${file} invalide :\n${z.prettifyError(r.error)}`);
  }
  return r.data;
}

export const sessions = parse(z.array(Session), sessionsJson, "sessions.json")
  .slice()
  .sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
export const venues = parse(z.array(Venue), venuesJson, "venues.json");
export const sports = parse(z.array(Sport), sportsJson, "sports.json");
export const meta = parse(Meta, metaJson, "meta.json");

export const venueById = new Map(venues.map((v) => [v.id, v]));
export const sportById = new Map(sports.map((s) => [s.id, s]));
export const sessionById = new Map(sessions.map((s) => [s.id, s]));

// Intégrité référentielle : vérifiée au build aussi.
for (const s of sessions) {
  if (!venueById.has(s.venueId)) throw new Error(`${s.id} : site inconnu ${s.venueId}`);
  if (s.sportId && !sportById.has(s.sportId)) throw new Error(`${s.id} : sport inconnu ${s.sportId}`);
}

export const officialLinks = {
  programmePdf: sourcesJson.programmePdf.fileUrl,
  programmePage: sourcesJson.programmePdf.pageUrl,
  ticketing: sourcesJson.tickets.programmeUrl,
  ticketingHome: sourcesJson.tickets.homeUrl,
  mobilityGuide: sourcesJson.mobilityGuide.fileUrl,
  officialGuide: sourcesJson.officialGuide.pageUrl,
  olympicsProgramme: sourcesJson.olympicsCom.programmeUrl,
};

const src = sourcesJson;
export const sourceList: { id: string; label: string; url: string }[] = [
  { id: src.programmePdf.id, label: src.programmePdf.label, url: src.programmePdf.pageUrl },
  { id: src.tickets.id, label: src.tickets.label, url: src.tickets.homeUrl },
  { id: src.mobilityGuide.id, label: src.mobilityGuide.label, url: src.mobilityGuide.fileUrl },
  { id: src.officialGuide.id, label: src.officialGuide.label, url: src.officialGuide.pageUrl },
  { id: src.olympicsCom.id, label: src.olympicsCom.label, url: src.olympicsCom.programmeUrl },
];

export function sessionLabel(s: Session): { label: string; emoji: string } {
  if (s.kind === "fan" || !s.sportId) return { label: s.title ?? "Événement", emoji: "🎉" };
  const sp = sportById.get(s.sportId)!;
  return { label: sp.nameFr, emoji: sp.emoji };
}

export function toCard(s: Session): CardData {
  const v = venueById.get(s.venueId)!;
  const { label, emoji } = sessionLabel(s);
  const sp = s.sportId ? sportById.get(s.sportId) : undefined;
  return {
    id: s.id,
    kind: s.kind,
    label,
    emoji,
    sportId: s.sportId,
    venueId: s.venueId,
    venueName: v.name,
    cluster: v.cluster,
    hall: s.hall,
    start: s.start,
    end: s.end,
    day: dayKey(s.start),
    events: s.events.slice(0, 2),
    moreEvents: Math.max(0, s.events.length - 2),
    hasFinal: s.hasFinal,
    isFree: s.isFree,
    soldOut: s.ticketStatus === "soldout",
    scheduleChanged: s.scheduleConflict !== null,
    search: normalize(
      [s.id, label, sp?.nameEn ?? "", v.name, ...v.aliases, s.hall ?? "", ...s.events, ...s.eventsRaw].join(" "),
    ),
  };
}

export const cards: CardData[] = sessions.map(toCard);

/** Jours qui ont au moins une session, triés. */
export const days: string[] = [...new Set(cards.map((c) => c.day))].sort();

export function cardsForDay(day: string): CardData[] {
  return cards.filter((c) => c.day === day);
}

/** Sports présents dans les données, pour les puces de filtre. */
export const sportChips = sports
  .filter((sp) => sessions.some((s) => s.sportId === sp.id))
  .map((sp) => ({ id: sp.id, label: sp.nameFr, emoji: sp.emoji }))
  .sort((a, b) => a.label.localeCompare(b.label, "fr"));

/** Jour du build à Dakar (next.config.ts). */
export const buildDay: string = process.env.JOJ_BUILD_DAY!;

/** Jour mis en avant sur l'accueil pré-rendu : le jour du build s'il a des sessions, sinon
 *  le prochain jour de compétition, sinon null (Jeux terminés). */
export const homeDay: { day: string | null; isToday: boolean } = days.includes(buildDay)
  ? { day: buildDay, isToday: true }
  : { day: days.find((d) => d > buildDay) ?? null, isToday: false };

/** Image de partage du jour (route /og/[file]) : URL datée, change à chaque rebuild quotidien. */
export const homeOgImage = {
  url: homeDay.day ? `/og/jour-${homeDay.day}.png` : "/og/fin.png",
  width: 1200,
  height: 630,
  alt: "JOJ Guide — ce qu'on peut voir aux JOJ Dakar 2026 ce jour-là (guide non officiel)",
};

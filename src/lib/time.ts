// Heure locale des Jeux = Africa/Dakar (UTC+0, pas d'heure d'été). Toutes les fonctions
// formatent dans ce fuseau, quel que soit celui du visiteur.
export const TZ = "Africa/Dakar";

const timeFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const longDayFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
const shortWeekdayFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, weekday: "short" });
const dayNumFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "numeric" });
const updatedFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TZ, day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
});

/** "10:00" */
export function hhmm(iso: string): string {
  return timeFmt.format(new Date(iso));
}

/** "2026-11-09" (jour à Dakar) */
export function dayKey(isoOrDate: string | Date): string {
  return dayKeyFmt.format(typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate);
}

/** Midi à Dakar ce jour-là : évite tout décalage de date au formatage. */
function noon(key: string): Date {
  return new Date(`${key}T12:00:00+00:00`);
}

/** "lundi 9 novembre" */
export function longDay(key: string): string {
  return longDayFmt.format(noon(key));
}

/** { weekday: "Lun", num: "9" } pour le bandeau de jours */
export function shortDay(key: string): { weekday: string; num: string } {
  const w = shortWeekdayFmt.format(noon(key)).replace(".", "");
  return { weekday: w.charAt(0).toUpperCase() + w.slice(1), num: dayNumFmt.format(noon(key)) };
}

export function addDays(key: string, n: number): string {
  const d = noon(key);
  d.setUTCDate(d.getUTCDate() + n);
  return dayKey(d);
}

/** "2 novembre à 18:35" */
export function updatedAt(iso: string): string {
  return updatedFmt.format(new Date(iso));
}

/** Durée supposée d'une session dont le programme ne donne pas la fin. Sert uniquement au calcul
 *  (en cours, terminé, à venir) : on n'affiche jamais cette fin supposée. */
export const ASSUMED_DURATION_MS = 3 * 3600_000;

/** Fin d'une session en millisecondes : la vraie, sinon début + 3 h. */
export function endMs(start: string, end: string | null): number {
  return end === null ? Date.parse(start) + ASSUMED_DURATION_MS : Date.parse(end);
}

/** "10:00–14:37", ou "14:00" si la fin n'est pas connue */
export function timeRange(start: string, end: string | null): string {
  return end ? `${hhmm(start)}–${hhmm(end)}` : hhmm(start);
}

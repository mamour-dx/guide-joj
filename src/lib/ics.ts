// Fichier .ics généré côté client (aucun envoi au serveur). Les heures sont en UTC,
// ce qui est exactement l'heure de Dakar (UTC+0) ; X-WR-TIMEZONE indique Africa/Dakar.
import { ASSUMED_DURATION_MS } from "./time";

export type IcsEvent = {
  uid: string;
  title: string;
  start: string;          // ISO avec offset
  end: string | null;     // null → durée inconnue : on bloque 3 h et on le dit dans la description
  location: string;
  description: string;
  url: string;
};

function stamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Plie les lignes à 75 octets (RFC 5545). */
function fold(line: string): string {
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > 74) {
      out.push(cur);
      cur = " " + ch;
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.join("\r\n");
}

export function buildIcs(e: IcsEvent, now: Date): string {
  const end = e.end ?? new Date(new Date(e.start).getTime() + ASSUMED_DURATION_MS).toISOString();
  const description = e.end
    ? e.description
    : `${e.description}\n\nHeure de fin non communiquée : créneau de 3 h indicatif.`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JOJ Guide non officiel//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-TIMEZONE:Africa/Dakar",
    "BEGIN:VEVENT",
    `UID:${e.uid}@joj-guide`,
    `DTSTAMP:${stamp(now.toISOString())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(e.title)}`,
    `LOCATION:${escape(e.location)}`,
    `DESCRIPTION:${escape(description)}`,
    `URL:${e.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

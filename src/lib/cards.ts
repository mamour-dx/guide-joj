// Forme allégée d'une session pour l'affichage en liste (cartes, fichiers par jour).
// Aucun import de zod ni des JSON : ce module peut aller dans le bundle client.
import type { Cluster } from "./schema";

export type CardData = {
  id: string;
  kind: "sport" | "fan";
  label: string;          // nom du sport en français, ou titre de l'événement Fan
  emoji: string;
  sportId: string | null;
  venueId: string;
  venueName: string;
  cluster: Cluster;
  hall: string | null;
  start: string;
  end: string | null;
  day: string;            // "2026-11-09", jour à Dakar
  events: string[];       // 2 premières épreuves
  moreEvents: number;     // « +14 »
  hasFinal: boolean;
  isFree: boolean | null;
  scheduleChanged: boolean;
  search: string;         // texte normalisé pour la recherche locale
};

export const CLUSTER_LABEL: Record<Cluster, string> = {
  dakar: "Dakar",
  diamniadio: "Diamniadio",
  saly: "Saly",
};

export const CLUSTERS: Cluster[] = ["dakar", "diamniadio", "saly"];

/** minuscules, sans accents : « Athlétisme » → « athletisme » */
export function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Filtres partagés par l'accueil et le programme. Sérialisables dans l'URL :
// ?jour=2026-11-09&secteur=saly&sport=athletics,judo&gratuit=1&finale=1&q=sen
import type { Cluster } from "./schema";
import { CLUSTERS, normalize, type CardData } from "./cards";

export type Filters = {
  free: boolean;
  finals: boolean;
  clusters: Cluster[];
  sports: string[];
  q: string;
};

export const EMPTY_FILTERS: Filters = { free: false, finals: false, clusters: [], sports: [], q: "" };

export function applyFilters(cards: CardData[], f: Filters): CardData[] {
  const terms = normalize(f.q).split(/\s+/).filter(Boolean);
  return cards.filter((c) => {
    if (f.free && c.isFree !== true) return false;
    if (f.finals && !c.hasFinal) return false;
    if (f.clusters.length && !f.clusters.includes(c.cluster)) return false;
    if (f.sports.length && !(c.sportId && f.sports.includes(c.sportId))) return false;
    return terms.every((t) => c.search.includes(t));
  });
}

function list(v: string | null): string[] {
  return v ? v.split(",").map((x) => x.trim()).filter(Boolean) : [];
}

export function filtersFromParams(p: URLSearchParams): Filters {
  return {
    free: p.get("gratuit") === "1",
    finals: p.get("finale") === "1",
    clusters: list(p.get("secteur")).filter((c): c is Cluster => (CLUSTERS as string[]).includes(c)),
    sports: list(p.get("sport")),
    q: p.get("q") ?? "",
  };
}

export function filtersToParams(f: Filters, base: URLSearchParams): URLSearchParams {
  const p = new URLSearchParams(base);
  const set = (k: string, v: string) => (v ? p.set(k, v) : p.delete(k));
  set("gratuit", f.free ? "1" : "");
  set("finale", f.finals ? "1" : "");
  set("secteur", f.clusters.join(","));
  set("sport", f.sports.join(","));
  set("q", f.q.trim());
  return p;
}

export function activeCount(f: Filters): number {
  return Number(f.free) + Number(f.finals) + f.clusters.length + f.sports.length + (f.q.trim() ? 1 : 0);
}

export function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

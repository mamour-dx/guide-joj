// Réglages éditoriaux du site. null = non affiché (rien n'est inventé).
import { officialBranding } from "./brand";

export const site = {
  name: officialBranding ? "Dakar 2026 · Guide des sessions" : "JOJ Guide",
  shortName: officialBranding ? "Guide des sessions" : "JOJ Guide",
  tagline: officialBranding ? "Le guide des sessions des JOJ Dakar 2026" : "Le guide non officiel des JOJ Dakar 2026",
  slogan: "L'Afrique accueille, Dakar célèbre.",
  disclaimer: officialBranding
    ? "Horaires issus du programme officiel, à vérifier sur la billetterie officielle."
    : "Site non officiel, sans affiliation avec le COJOJ Dakar 2026 ni le CIO. Horaires à vérifier sur les sources officielles.",
  channelUrl: "https://www.youtube.com/@mxr_codes" as string | null,
  contact: "mxrcodes@gmail.com" as string | null,
  /** Chaînes YouTube dont on signale le direct (bandeau « En direct »). Id de chaîne vérifié
   *  sur youtube.com/@RTS2Sénégal-x1s. */
  liveChannels: [{ name: "RTS2", channelId: "UC3picN6aAKBCztkoxJ5dbXA" }],
};

/** URL publique du site : NEXT_PUBLIC_SITE_URL, sinon le domaine de production Vercel.
 *  Le nom de domaine définitif n'est pas encore choisi : le jour venu, il suffit de régler
 *  NEXT_PUBLIC_SITE_URL sur Vercel (canonical, sitemap, robots, og:url et JSON-LD suivent). */
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
);

/** Les déploiements de preview Vercel ne doivent pas être indexés (contenu en double). */
export const indexable = process.env.VERCEL_ENV === undefined || process.env.VERCEL_ENV === "production";

export const absoluteUrl = (path: string) => new URL(path, siteUrl).toString();

export function mapsUrl(v: { lat: number | null; lng: number | null; mapsQuery: string }): string {
  const dest = v.lat !== null && v.lng !== null ? `${v.lat},${v.lng}` : v.mapsQuery;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

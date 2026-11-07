// Réglages éditoriaux du site. null = non affiché (rien n'est inventé).

export const site = {
  name: "JOJ Guide",
  shortName: "JOJ Guide",
  tagline: "Le guide non officiel des JOJ Dakar 2026",
  disclaimer:
    "Site non officiel, sans affiliation avec le COJOJ Dakar 2026 ni le CIO. Horaires à vérifier sur les sources officielles.",
  channelUrl: "https://www.youtube.com/@mxr_codes" as string | null,
  contact: "hi@mxr.codes" as string | null,
  /** Code source public (open source). */
  repoUrl: "https://github.com/mamour-dx/guide-joj" as string | null,
  /** Chaînes YouTube dont on signale le direct (bandeau « En direct »), par ordre de priorité :
   *  un seul direct affiché, le premier de la liste qui est en live. Ids de chaîne relevés sur
   *  youtube.com/@Olympics et youtube.com/@RTS2Sénégal-x1s. */
  liveChannels: [
    { name: "Olympics", channelId: "UCTl3QQTvqHFjurroKxexy2Q" },
    { name: "RTS2", channelId: "UC3picN6aAKBCztkoxJ5dbXA" },
  ],
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

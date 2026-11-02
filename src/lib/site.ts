// Réglages éditoriaux du site. null = non affiché (rien n'est inventé).
export const site = {
  name: "JOJ Guide",
  tagline: "Le guide non officiel des JOJ Dakar 2026",
  disclaimer:
    "Site non officiel, sans affiliation avec le COJOJ Dakar 2026 ni le CIO. Horaires à vérifier sur les sources officielles.",
  channelUrl: "https://www.youtube.com/@mxr_codes" as string | null,
  contact: "mxrcodes@gmail.com" as string | null,
};

/** URL publique du site : NEXT_PUBLIC_SITE_URL, sinon le domaine de production Vercel. */
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
);

export function mapsUrl(v: { lat: number | null; lng: number | null; mapsQuery: string }): string {
  const dest = v.lat !== null && v.lng !== null ? `${v.lat},${v.lng}` : v.mapsQuery;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

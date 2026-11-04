// Direct YouTube en cours parmi les chaînes suivies (site.liveChannels, par ordre de priorité).
// 1. Flux RSS public de chaque chaîne (sans clé, sans quota) : ses 15 dernières vidéos ; un direct
//    y figure en tête, même programmé des semaines à l'avance (cas des directs Olympics).
// 2. API officielle YouTube Data v3 (clé YOUTUBE_API_KEY) : statut de ces vidéos en un seul appel,
//    1 unité de quota. Résultat mis en cache 2 min : au plus ~720 unités par jour (quota : 10 000).
// Ce n'est pas du scraping : flux et API publics de YouTube. Sans clé, ou si YouTube répond mal :
// null, le bandeau ne s'affiche simplement pas.
import { cacheLife } from "next/cache";
import { site } from "./site";

export type LiveStream = { channel: string; title: string; url: string };

async function recentVideoIds(channelId: string): Promise<string[]> {
  const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
  if (!r.ok) throw new Error(`flux YouTube ${r.status}`);
  return [...(await r.text()).matchAll(/<yt:videoId>([\w-]{11})<\/yt:videoId>/g)].map((m) => m[1]);
}

/** Le direct de la chaîne la plus prioritaire qui est en live (Olympics avant RTS2), sinon null. */
export async function currentLive(): Promise<LiveStream | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 600 });

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  try {
    // une chaîne dont le flux ne répond pas n'empêche pas de vérifier les autres
    const feeds = await Promise.allSettled(site.liveChannels.map((ch) => recentVideoIds(ch.channelId)));
    const ids = feeds.flatMap((f) => (f.status === "fulfilled" ? f.value : [])).slice(0, 50);
    if (!ids.length) return null;

    const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ids.join(",")}&key=${key}`);
    if (!r.ok) return null;
    const { items = [] } = (await r.json()) as {
      items?: { id: string; snippet: { title: string; channelId: string; liveBroadcastContent: string } }[];
    };
    for (const ch of site.liveChannels) {
      const v = items.find((i) => i.snippet.channelId === ch.channelId && i.snippet.liveBroadcastContent === "live");
      if (v) return { channel: ch.name, title: v.snippet.title, url: `https://www.youtube.com/watch?v=${v.id}` };
    }
    return null;
  } catch {
    return null;
  }
}

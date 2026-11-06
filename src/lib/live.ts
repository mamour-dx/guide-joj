// Direct YouTube en cours parmi les chaînes suivies (site.liveChannels, par ordre de priorité).
// Vidéos récentes de chaque chaîne, de deux sources, réunies :
// - le flux RSS public (sans quota) : un direct y figure en tête, même programmé des semaines à
//   l'avance (cas des directs Olympics) ; mais YouTube le refuse parfois aux serveurs d'hébergeurs ;
// - la playlist « uploads » via l'API officielle YouTube Data v3 (1 unité), toujours joignable.
// Puis le statut de toutes ces vidéos en un appel (1 unité). Clé : YOUTUBE_API_KEY. Résultat mis en
// cache 2 min : au plus ~3 unités par vérification, ~2 200 par jour (quota gratuit : 10 000).
// Ce n'est pas du scraping : flux et API publics de YouTube. Sans clé, ou si YouTube répond mal :
// pas de direct, le bandeau ne s'affiche simplement pas. `check` dit pourquoi (diagnostic).
import { cacheLife } from "next/cache";
import { site } from "./site";

export type LiveStream = { channel: string; title: string; url: string };
export type LiveCheck = { key: boolean; feeds: number; uploads: number; api: string };

const API = "https://www.googleapis.com/youtube/v3";

async function feedIds(channelId: string): Promise<string[]> {
  const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
  if (!r.ok) throw new Error(`flux ${r.status}`);
  return [...(await r.text()).matchAll(/<yt:videoId>([\w-]{11})<\/yt:videoId>/g)].map((m) => m[1]);
}

async function uploadIds(channelId: string, key: string): Promise<string[]> {
  // playlist « uploads » d'une chaîne = son id avec le préfixe UC remplacé par UU
  const r = await fetch(`${API}/playlistItems?part=contentDetails&maxResults=10&playlistId=UU${channelId.slice(2)}&key=${key}`);
  if (!r.ok) throw new Error(`uploads ${r.status}`);
  const { items = [] } = (await r.json()) as { items?: { contentDetails: { videoId: string } }[] };
  return items.map((i) => i.contentDetails.videoId);
}

const ok = <T,>(results: PromiseSettledResult<T[]>[]) => results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
const okCount = (results: PromiseSettledResult<unknown>[]) => results.filter((r) => r.status === "fulfilled").length;

/** Le direct de la chaîne la plus prioritaire qui est en live (Olympics avant RTS2), sinon null. */
export async function currentLive(): Promise<{ live: LiveStream | null; check: LiveCheck }> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 600 });

  const key = process.env.YOUTUBE_API_KEY;
  const check: LiveCheck = { key: Boolean(key), feeds: 0, uploads: 0, api: "non appelée" };
  if (!key) return { live: null, check };

  // une source ou une chaîne qui ne répond pas n'empêche pas de vérifier le reste
  const [feeds, uploads] = await Promise.all([
    Promise.allSettled(site.liveChannels.map((ch) => feedIds(ch.channelId))),
    Promise.allSettled(site.liveChannels.map((ch) => uploadIds(ch.channelId, key))),
  ]);
  check.feeds = okCount(feeds);
  check.uploads = okCount(uploads);
  const ids = [...new Set([...ok(feeds), ...ok(uploads)])].slice(0, 50);
  if (!ids.length) return { live: null, check };

  try {
    const r = await fetch(`${API}/videos?part=snippet&id=${ids.join(",")}&key=${key}`);
    check.api = r.ok ? "ok" : `erreur ${r.status}`;
    if (!r.ok) return { live: null, check };
    const { items = [] } = (await r.json()) as {
      items?: { id: string; snippet: { title: string; channelId: string; liveBroadcastContent: string } }[];
    };
    for (const ch of site.liveChannels) {
      const v = items.find((i) => i.snippet.channelId === ch.channelId && i.snippet.liveBroadcastContent === "live");
      if (v) return { live: { channel: ch.name, title: v.snippet.title, url: `https://www.youtube.com/watch?v=${v.id}` }, check };
    }
  } catch {
    check.api = "injoignable";
  }
  return { live: null, check };
}

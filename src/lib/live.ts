// Directs YouTube des chaînes suivies (site.liveChannels), lus côté serveur avec l'API officielle
// YouTube Data v3 : les dernières vidéos de la chaîne (playlist « uploads »), puis leur statut.
// Ce n'est pas du scraping : API publique avec clé (YOUTUBE_API_KEY), résultat mis en cache 2 min,
// soit environ 2 unités de quota par vérification (quota gratuit : 10 000 par jour).
// Sans clé, ou si YouTube répond mal : liste vide, le bandeau ne s'affiche simplement pas.
import { cacheLife } from "next/cache";
import { site } from "./site";

export type LiveStream = { channel: string; title: string; url: string };

const API = "https://www.googleapis.com/youtube/v3";

async function getJson(url: string): Promise<{ items?: unknown[] }> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`YouTube API ${r.status}`);
  return r.json();
}

export async function liveStreams(): Promise<LiveStream[]> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 120, expire: 600 });

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];
  try {
    // playlist « uploads » d'une chaîne = son id avec le préfixe UC remplacé par UU ;
    // un direct en cours y figure en tête
    const lists = await Promise.all(
      site.liveChannels.map((ch) =>
        getJson(`${API}/playlistItems?part=contentDetails&maxResults=5&playlistId=UU${ch.channelId.slice(2)}&key=${key}`),
      ),
    );
    const ids = lists.flatMap((l) => (l.items ?? []).map((i) => (i as { contentDetails: { videoId: string } }).contentDetails.videoId));
    if (!ids.length) return [];

    const videos = await getJson(`${API}/videos?part=snippet&id=${ids.join(",")}&key=${key}`);
    return (videos.items ?? []).flatMap((item) => {
      const v = item as { id: string; snippet: { title: string; channelId: string; liveBroadcastContent: string } };
      if (v.snippet.liveBroadcastContent !== "live") return [];
      const ch = site.liveChannels.find((c) => c.channelId === v.snippet.channelId);
      return [{ channel: ch?.name ?? "YouTube", title: v.snippet.title, url: `https://www.youtube.com/watch?v=${v.id}` }];
    });
  } catch {
    return [];
  }
}

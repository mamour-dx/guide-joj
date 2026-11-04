"use client";

// Bandeau « En direct » sous l'en-tête, quand une chaîne suivie diffuse sur YouTube (un seul
// direct : Olympics avant RTS2, voir site.liveChannels).
// Interroge /api/live (cache serveur de 2 min) au chargement, puis toutes les 2 min tant que la page
// est visible. Lien sortant vers YouTube, rien n'est intégré : pas de lecteur, pas de cookie.
// « Masquer » vaut pour ce direct et cet onglet (sessionStorage), un nouveau direct réapparaît.
import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { LiveStream } from "@/lib/live";

const POLL_MS = 120_000;
const dismissKey = (url: string) => `live-hidden:${url}`;

function isDismissed(url: string): boolean {
  try {
    return sessionStorage.getItem(dismissKey(url)) === "1";
  } catch {
    return false;
  }
}

export function LiveBanner() {
  const [live, setLive] = useState<LiveStream | null>(null);

  useEffect(() => {
    let stopped = false;
    async function check() {
      if (document.hidden) return;
      try {
        const r = await fetch("/api/live");
        if (!r.ok) return;
        const { live: stream } = (await r.json()) as { live: LiveStream | null };
        if (!stopped) setLive(stream && !isDismissed(stream.url) ? stream : null);
      } catch {
        // hors ligne : on garde l'état actuel
      }
    }
    check();
    const id = setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  if (!live) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(dismissKey(live!.url), "1");
    } catch {
      // stockage indisponible : masqué jusqu'au prochain chargement
    }
    setLive(null);
  }

  return (
    <aside aria-label={`${live.channel} en direct`} className="live-banner bleed-black border-b-2 border-line bg-[var(--bleed)]">
      <div className="mx-auto flex w-full max-w-2xl items-stretch pl-4">
        <a href={live.url} target="_blank" rel="noopener" className="group flex min-h-14 min-w-0 flex-1 items-center gap-3">
          <span className="flex shrink-0 items-center gap-2 self-stretch bg-o-red px-3 font-mono text-xs font-medium uppercase text-black">
            <span className="live-dot" aria-hidden="true" />
            En direct
          </span>
          <span className="min-w-0 flex-1 py-2">
            <span className="display block text-2xl leading-none">{live.channel} est en live</span>
            <span className="eyebrow mt-0.5 block truncate text-xs text-[#B4B4AA]">{live.title}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
            <span className="hidden min-[400px]:inline">Regarder</span>
            <ArrowUpRight aria-hidden="true" size={18} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            <span className="sr-only"> sur YouTube</span>
          </span>
        </a>
        <button type="button" onClick={dismiss} aria-label="Masquer le bandeau du direct" className="flex w-12 shrink-0 items-center justify-center text-[#B4B4AA] transition-colors hover:text-[#F6F6F3]">
          <X aria-hidden="true" size={18} />
        </button>
      </div>
    </aside>
  );
}

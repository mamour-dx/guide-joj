"use client";

import { CalendarPlus, Check, Navigation, Share2 } from "lucide-react";
import { useState } from "react";
import { buildIcs, type IcsEvent } from "@/lib/ics";

const btn =
  "card pressable flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-sm font-semibold";

/** Pastille d'icône ; passe au vert avec une coche quand l'action a réussi. */
function Icon({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <span
      key={String(done)}
      className={`pop flex size-9 items-center justify-center rounded-full transition-colors ${done ? "bg-o-green text-white" : "bg-tint text-blue-ink"}`}
    >
      {done ? <Check aria-hidden="true" size={18} strokeWidth={3} /> : children}
    </span>
  );
}

export function SessionActions({ ics, mapsHref, shareTitle }: { ics: Omit<IcsEvent, "url">; mapsHref: string; shareTitle: string }) {
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);

  function addToCalendar() {
    const blob = new Blob([buildIcs({ ...ics, url: location.href }, new Date())], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${ics.uid}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  async function share() {
    const data = { title: shareTitle, url: location.href };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        // partage annulé : on ne fait rien
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Copie ce lien :", location.href);
    }
  }

  return (
    <div className="mt-3 flex gap-2">
      <button type="button" onClick={addToCalendar} className={btn} aria-live="polite">
        <Icon done={added}><CalendarPlus aria-hidden="true" size={20} /></Icon>
        {added ? "Fichier prêt" : "Agenda"}
      </button>
      <a href={mapsHref} target="_blank" rel="noopener" className={btn}>
        <Icon done={false}><Navigation aria-hidden="true" size={20} /></Icon>
        <span className="leading-tight">
          Itinéraire
          <span className="block text-[0.6875rem] font-medium text-muted">Google Maps</span>
        </span>
      </a>
      <button type="button" onClick={share} className={btn} aria-live="polite">
        <Icon done={copied}><Share2 aria-hidden="true" size={20} /></Icon>
        {copied ? "Lien copié" : "Partager"}
      </button>
    </div>
  );
}

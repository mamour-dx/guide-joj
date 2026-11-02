"use client";

import { CalendarPlus, Check, Navigation, Share2 } from "lucide-react";
import { useState } from "react";
import { buildIcs, type IcsEvent } from "@/lib/ics";

const btn =
  "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 border border-line bg-surface px-2 py-2 text-sm font-semibold";

export function SessionActions({ ics, mapsHref, shareTitle }: { ics: Omit<IcsEvent, "url">; mapsHref: string; shareTitle: string }) {
  const [copied, setCopied] = useState(false);

  function addToCalendar() {
    const blob = new Blob([buildIcs({ ...ics, url: location.href }, new Date())], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${ics.uid}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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
      <button type="button" onClick={addToCalendar} className={btn}>
        <CalendarPlus aria-hidden="true" size={20} />
        Agenda
      </button>
      <a href={mapsHref} target="_blank" rel="noopener" className={btn}>
        <Navigation aria-hidden="true" size={20} />
        Itinéraire
      </a>
      <button type="button" onClick={share} className={btn} aria-live="polite">
        {copied ? <Check aria-hidden="true" size={20} /> : <Share2 aria-hidden="true" size={20} />}
        {copied ? "Lien copié" : "Partager"}
      </button>
    </div>
  );
}

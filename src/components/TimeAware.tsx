"use client";

// Petits îlots qui dépendent de l'heure : calculés dans le navigateur uniquement.
import { useEffect, useState } from "react";
import { dayKey } from "@/lib/time";
import { useNow } from "@/lib/useNow";

/** « 12 sessions à venir » — `ends` = fin (ou début si fin inconnue) de chaque session. */
export function RemainingCount({ ends, total }: { ends: string[]; total: number }) {
  const now = useNow();
  if (now === null) return <>{total} session{total > 1 ? "s" : ""}</>;
  const n = ends.filter((e) => Date.parse(e) > now).length;
  if (n === 0) return <>Plus de session à venir</>;
  return <>{n} session{n > 1 ? "s" : ""} à venir</>;
}

/** Masque les jours passés d'une liste rendue côté serveur (sections [data-past-day]). */
export function HidePastDays({ scope, days }: { scope: string; days: string[] }) {
  const now = useNow();
  const [show, setShow] = useState(false);
  // le style posé avant l'hydratation (voir sites/[id]/page.tsx) est remplacé par le nôtre
  useEffect(() => {
    if (now !== null) document.getElementById("past-initial")?.remove();
  }, [now]);
  const today = now === null ? null : dayKey(new Date(now));
  const past = today === null ? [] : days.filter((d) => d < today);
  const css = show ? "" : past.map((d) => `#${scope} [data-past-day="${d}"]{display:none}`).join("");
  // hauteur réservée dès le rendu serveur : le bouton n'apparaît pas en poussant la liste
  return (
    <div className="min-h-11">
      <style>{css}</style>
      {past.length > 0 && (
        <button type="button" onClick={() => setShow(!show)} className="min-h-11 text-sm font-bold text-blue-ink underline">
          {show ? "Masquer les jours passés" : `Afficher les jours passés (${past.length})`}
        </button>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { ProgrammeControls } from "@/components/ProgrammeControls";
import { SessionCard } from "@/components/SessionCard";
import { CLUSTER_LABEL, CLUSTERS } from "@/lib/cards";
import { cards, days, sportChips } from "@/lib/data";
import { programmeCss, dakarToday } from "@/lib/programmeCss";
import { longDay, shortDay } from "@/lib/time";

export const metadata: Metadata = {
  title: "Programme complet",
  description: "Toutes les sessions des JOJ Dakar 2026, jour par jour, par secteur et par heure.",
};

/** Avant hydratation (et sans JS) : bandeau d'ancres vers chaque jour, plus des emplacements
 *  de même hauteur que la recherche et les puces, pour que rien ne bouge au remplacement. */
function StaticDayStrip() {
  return (
    <>
    <nav aria-label="Jours" className="sticky top-0 z-10 -mx-4 flex gap-1.5 overflow-x-auto bg-sand/95 px-4 py-2 no-scrollbar">
      {days.map((d) => {
        const { weekday, num } = shortDay(d);
        return (
          <a key={d} href={`#j-${d}`} className="flex min-h-14 min-w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-surface px-2 text-sm leading-tight">
            <span className="font-semibold">{weekday}</span>
            <span className="tabular text-lg font-extrabold">{num}</span>
          </a>
        );
      })}
    </nav>
    <div aria-hidden="true" className="mt-1 min-h-12 rounded-xl border border-line bg-surface" />
    <div aria-hidden="true" className="min-h-15" />
    </>
  );
}

/** Script exécuté avant le premier affichage : applique tout de suite les filtres de l'URL
 *  (et le jour par défaut), avec le même code que ProgrammeControls, pour éviter le saut de
 *  mise en page à l'hydratation. ProgrammeControls retire ce style une fois monté. */
function initialScript(): string {
  return `(function(){try{var programmeCss=${programmeCss.toString()};var dakarToday=${dakarToday.toString()};
var s=document.createElement("style");s.id="prog-initial";
s.textContent=programmeCss(location.search,${JSON.stringify(days)},dakarToday());
document.head.appendChild(s);}catch(e){}})();`;
}

export default function ProgrammePage() {
  return (
    <>
      <h1 className="mt-2 text-2xl font-extrabold">Programme</h1>
      <Suspense fallback={<StaticDayStrip />}>
        <ProgrammeControls days={days} sports={sportChips} />
      </Suspense>

      <script dangerouslySetInnerHTML={{ __html: initialScript() }} />
      <div id="prog" className="mt-2">
        <p className="prog-empty mt-4 hidden rounded-xl bg-surface p-4">Aucune session ne correspond à ces filtres.</p>
        {days.map((d) => (
          <section key={d} id={`j-${d}`} data-group="day" data-day={d} className="scroll-mt-24">
            <h2 className="mt-5 text-lg font-extrabold first-letter:uppercase">{longDay(d)}</h2>
            {CLUSTERS.map((cl) => {
              const list = cards.filter((c) => c.day === d && c.cluster === cl);
              if (!list.length) return null;
              return (
                <div key={cl} data-group="cluster" className="mt-3">
                  <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-muted">{CLUSTER_LABEL[cl]}</h3>
                  <ul className="space-y-2.5">
                    {list.map((c) => (
                      <li
                        key={c.id}
                        data-card=""
                        data-day={c.day}
                        data-cluster={c.cluster}
                        data-sport={c.sportId ?? "fan"}
                        data-free={c.isFree === true ? "" : undefined}
                        data-final={c.hasFinal ? "" : undefined}
                        data-search={c.search}
                      >
                        <SessionCard c={c} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/PageHero";
import { ProgrammeControls } from "@/components/ProgrammeControls";
import { CLUSTER_DOT, SessionCard } from "@/components/SessionCard";
import { CLUSTER_LABEL, CLUSTERS } from "@/lib/cards";
import { cards, days, sportChips, homeOgImage } from "@/lib/data";
import { programmeCss, dakarToday } from "@/lib/programmeCss";
import { longDay, shortDay } from "@/lib/time";
import { pageSeo } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Programme complet",
  description: "Toutes les sessions des JOJ Dakar 2026, jour par jour, par secteur et par heure.",
  ...pageSeo("/programme", [homeOgImage]),
};

/** Avant hydratation (et sans JS) : bandeau d'ancres vers chaque jour, plus des emplacements
 *  de même hauteur que la recherche et les puces, pour que rien ne bouge au remplacement. */
function StaticDayStrip() {
  return (
    <>
    <nav aria-label="Jours" className="sticky top-[var(--frame)] z-10 -mx-4 flex gap-1.5 overflow-x-auto bg-page/95 px-4 py-2 no-scrollbar">
      {days.map((d) => {
        const { weekday, num } = shortDay(d);
        return (
          <a key={d} href={`#j-${d}`} className="flex min-h-14 min-w-12 shrink-0 flex-col items-center justify-center border-2 border-line bg-surface px-2 text-sm leading-tight">
            <span className="font-mono text-xs">{weekday}</span>
            <span className="tabular display text-2xl">{num}</span>
          </a>
        );
      })}
    </nav>
    <div aria-hidden="true" className="mt-1 min-h-12 border-2 border-line bg-surface" />
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
      <PageHero tone="yellow" eyebrow="Du 30 octobre au 13 novembre" title="Tout le programme." />
      <div className="h-2" aria-hidden="true" />
      <Suspense fallback={<StaticDayStrip />}>
        <ProgrammeControls days={days} sports={sportChips} />
      </Suspense>

      <script dangerouslySetInnerHTML={{ __html: initialScript() }} />
      <div id="prog" className="mt-2">
        <p className="prog-empty card mt-4 hidden p-4">Aucune session ne correspond à ces filtres.</p>
        {days.map((d) => (
          <section key={d} id={`j-${d}`} data-group="day" data-day={d} className="scroll-mt-24">
            <h2 className="display mt-10 text-5xl">{longDay(d)}.</h2>
            {CLUSTERS.map((cl) => {
              const list = cards.filter((c) => c.day === d && c.cluster === cl);
              if (!list.length) return null;
              return (
                <div key={cl} data-group="cluster" className="mt-3">
                  <h3 className="display mb-3 flex items-center gap-2 border-b-2 border-line pb-2 text-3xl">
                    <span className={`size-3.5 ring-1 ring-black ${CLUSTER_DOT[cl]}`} aria-hidden="true" />
                    {CLUSTER_LABEL[cl]}
                  </h3>
                  <ul className="space-y-3">
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

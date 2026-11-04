"use client";

// Accueil. Les sessions du jour du build sont pré-rendues en HTML (`initial`) : sans JS, ou
// avant l'hydratation, elles s'affichent en une seule liste « Au programme ». Une fois l'heure
// connue dans le navigateur, on les répartit en « En ce moment / Plus tard / Terminé ». Une session
// sans heure de fin est supposée durer 3 h (endMs) : elle finit par passer en « Déjà terminé ».
// Le fichier /data/day-….json n'est chargé que si le jour affiché n'est pas celui du build.
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CardData } from "@/lib/cards";
import { applyFilters, EMPTY_FILTERS, type Filters } from "@/lib/filters";
import { addDays, ASSUMED_DURATION_MS, dayKey, endMs, longDay } from "@/lib/time";
import { useNow } from "@/lib/useNow";
import { Mascot } from "./Brand";
import { PageHero } from "./PageHero";
import { FilterChips } from "./FilterChips";
import { SessionCard } from "./SessionCard";

type SportChip = { id: string; label: string; emoji: string };
type Load = { day: string; cards: CardData[] | null; error: boolean };
export type TodayInitial = { day: string | null; isToday: boolean; cards: CardData[] };

/** Jour à afficher pour « Aujourd'hui » : le jour même s'il a des sessions,
 *  sinon le prochain jour qui en a (avant ou pendant les Jeux), sinon null (Jeux terminés). */
function pickDay(today: string, days: string[]): { day: string | null; isToday: boolean } {
  if (days.includes(today)) return { day: today, isToday: true };
  const next = days.find((d) => d > today);
  return { day: next ?? null, isToday: false };
}

/** « 25 min », « 1 h 05 » */
function duration(ms: number): string {
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
}

/** Indications calculées avec l'heure du navigateur : temps restant et avancement en direct,
 *  compte à rebours pour ce qui commence dans moins de 3 h. Fin inconnue : en direct, mais sans
 *  temps restant ni barre d'avancement (la fin supposée n'est jamais affichée). */
function timing(c: CardData, now: number | null): { hint?: string; progress?: number } {
  if (now === null) return {};
  const s = Date.parse(c.start);
  const e = endMs(c.start, c.end);
  if (s <= now && now < e) return c.end === null ? {} : { hint: `encore ${duration(e - now)}`, progress: (now - s) / (e - s) };
  if (s > now && s - now < 3 * 3600_000) return { hint: `dans ${duration(s - now)}` };
  return {};
}

function SectionTitle({ title, count, tone }: { title: string; count: number | null; tone?: "live" | "muted" }) {
  return (
    <h2 className={`display mb-3 flex items-baseline gap-2 border-b-2 border-line pb-2 text-4xl ${tone === "live" ? "text-red-ink" : tone === "muted" ? "text-muted" : ""}`}>
      {tone === "live" && <span className="live-dot self-center" aria-hidden="true" />}
      {title}.
      {count !== null && <span className="ml-auto font-mono text-sm font-medium text-muted normal-case">{String(count).padStart(2, "0")}</span>}
    </h2>
  );
}

function Section({ title, tone, cards, live = false, sec, hidden = false, tagged = false, now = null, animate = false }: {
  title: string; tone?: "live"; cards: CardData[]; live?: boolean;
  sec?: string; hidden?: boolean; tagged?: boolean; now?: number | null; animate?: boolean;
}) {
  if (!cards.length) return null;
  return (
    <section className={`mt-8 ${hidden ? "hidden" : ""}`} data-sec={sec}>
      <SectionTitle title={title} count={hidden ? null : cards.length} tone={tone} />
      <ul className="space-y-3">
        {cards.map((c, i) => (
          <li
            key={c.id}
            data-id={c.id}
            data-start={tagged ? c.start : undefined}
            data-end={tagged ? c.end ?? "" : undefined}
            className={animate ? "rise" : undefined}
            style={animate ? ({ "--i": i } as React.CSSProperties) : undefined}
          >
            <SessionCard c={c} live={live} {...timing(c, now)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Skeleton() {
  return (
    <div className="mt-6 space-y-3" role="status" aria-label="Chargement des sessions">
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton h-32" />
      ))}
    </div>
  );
}

function DoneSection({ cards, sec, hidden = false }: { cards: CardData[]; sec?: string; hidden?: boolean }) {
  if (!cards.length) return null;
  return (
    <details className={`group mt-8 ${hidden ? "hidden" : ""}`} data-sec={sec}>
      <summary className="display flex min-h-11 cursor-pointer list-none items-center gap-2 border-b-2 border-line-soft py-2 text-4xl text-muted [&::-webkit-details-marker]:hidden">
        <ChevronRight aria-hidden="true" size={24} className="transition-transform duration-200 group-open:rotate-90" />
        Déjà terminé.
        <span className="ml-auto font-mono text-sm font-medium normal-case">{String(cards.length).padStart(2, "0")}</span>
      </summary>
      <ul className="mt-3 space-y-3">
        {cards.map((c) => (
          <li key={c.id} data-id={c.id} className="opacity-60 grayscale-[30%]"><SessionCard c={c} /></li>
        ))}
      </ul>
    </details>
  );
}

/** Script exécuté avant le premier affichage (HTML pré-rendu, jour du build = aujourd'hui) :
 *  remplit les sections « En ce moment / Plus tard / Terminé » par CSS selon l'heure, pour que
 *  la répartition faite ensuite par React ne fasse pas sauter la page. Sans JS : liste complète. */
const PREPAINT = `(function(){try{var r=document.getElementById("today-sections");if(!r)return;
var t=new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Dakar",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
if(t!==r.getAttribute("data-day"))return;var n=Date.now(),g={live:[],later:[],done:[]};
r.querySelectorAll('[data-sec="all"] li[data-id]').forEach(function(li){var s=Date.parse(li.getAttribute("data-start")),e=li.getAttribute("data-end");
e=e?Date.parse(e):s+${ASSUMED_DURATION_MS};g[s<=n?(n<e?"live":"done"):"later"].push(li.getAttribute("data-id"));});
var p="#today-sections ",c=p+'[data-sec="all"]{display:none}';
Object.keys(g).forEach(function(k){var q=p+'[data-sec="'+k+'"]';if(!g[k].length){c+=q+"{display:none}";return;}
c+=q+"{display:block}"+q+" li:not("+g[k].map(function(i){return'[data-id="'+i+'"]';}).join(",")+"){display:none}";});
var st=document.createElement("style");st.id="today-initial";st.textContent=c;document.head.appendChild(st);}catch(x){}})();`;

function Ended() {
  return (
    <div className="card mt-6 flex items-end gap-4 p-4">
      <Mascot height={150} />
      <div>
        <h1 className="display text-5xl">Les Jeux sont terminés.</h1>
        <p className="mt-2 text-muted">Les JOJ Dakar 2026 se sont déroulés du 30 octobre au 13 novembre 2026.</p>
        <Link href="/programme" className="btn mt-3">Revoir le programme <ChevronRight aria-hidden="true" size={18} className="nudge" /></Link>
      </div>
    </div>
  );
}

export function TodayView({ days, sports, initial }: { days: string[]; sports: SportChip[]; initial: TodayInitial }) {
  const now = useNow();
  const [tab, setTab] = useState<"today" | "tomorrow">("today");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [load, setLoad] = useState<Load | null>(null);
  // les cartes n'entrent en fondu qu'après une action (onglet, filtre), pas au premier affichage
  const [animate, setAnimate] = useState(false);
  const changeTab = (k: "today" | "tomorrow") => { setTab(k); setAnimate(true); };
  const changeFilters = (f: Filters) => { setFilters(f); setAnimate(true); };

  // Avant de connaître l'heure (HTML pré-rendu, sans JS, hydratation) : le jour du build.
  const today = now === null ? null : dayKey(new Date(now));
  const base = today === null ? { day: initial.day, isToday: initial.isToday } : pickDay(today, days);
  const tomorrow = base.day ? (base.isToday ? addDays(base.day, 1) : days.find((d) => d > base.day!) ?? null) : null;
  const shown = tab === "today" ? base.day : tomorrow;
  const shownHasData = shown !== null && days.includes(shown);
  const needsFetch = shownHasData && shown !== initial.day;

  useEffect(() => {
    if (!needsFetch || !shown) return;
    let cancelled = false;
    fetch(`/data/day-${shown}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((cards: CardData[]) => !cancelled && setLoad({ day: shown, cards, error: false }))
      .catch(() => !cancelled && setLoad({ day: shown, cards: null, error: true }));
    return () => {
      cancelled = true;
    };
  }, [shown, needsFetch]);

  useEffect(() => {
    if (now !== null) document.getElementById("today-initial")?.remove();
  }, [now]);

  const cards = shown === initial.day ? initial.cards : load?.day === shown ? load.cards : null;
  const filtered = useMemo(() => (cards ? applyFilters(cards, filters) : []), [cards, filters]);
  const daySports = useMemo(
    () => (cards ? sports.filter((s) => cards.some((c) => c.sportId === s.id)) : []),
    [cards, sports],
  );

  if (base.day === null) return <Ended />;

  // Répartition selon l'heure : seulement dans le navigateur, et seulement pour le jour même.
  const isLiveDay = now !== null && tab === "today" && base.isToday;
  const t = now ?? 0;
  const live = isLiveDay ? filtered.filter((c) => Date.parse(c.start) <= t && t < endMs(c.start, c.end)) : [];
  const later = isLiveDay ? filtered.filter((c) => Date.parse(c.start) > t) : filtered;
  const done = isLiveDay ? filtered.filter((c) => endMs(c.start, c.end) <= t) : [];

  return (
    <div>
      {/* aujourd'hui en vert, demain en jaune : on voit tout de suite quel jour est affiché */}
      <PageHero
        tone={tab === "tomorrow" ? "yellow" : "green"}
        eyebrow={tab === "tomorrow" ? "Et demain ?" : base.isToday ? "Qu'est-ce qu'on voit aujourd'hui ?" : "Prochain jour de compétition"}
        title={shown ? `${longDay(shown)}.` : "—"}
      >
        {cards && cards.length > 0 && (
          <p className="eyebrow mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
            {cards.length} session{cards.length > 1 ? "s" : ""}
            {live.length > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-black px-1.5 py-0.5 text-[#F6F6F3]">
                <span className="live-dot size-1.5 text-o-red" aria-hidden="true" />
                {live.length} en direct
              </span>
            )}
          </p>
        )}

        <div role="tablist" aria-label="Jour" className="mt-5 grid grid-cols-2 border-2 border-black">
          {(["today", "tomorrow"] as const).map((k) => (
            <button
              key={k}
              role="tab"
              type="button"
              aria-selected={tab === k}
              onClick={() => changeTab(k)}
              className={`min-h-12 text-base font-medium transition-colors duration-200 ${tab === k ? "bg-black text-[#F6F6F3]" : "text-black hover:bg-black/10"}`}
            >
              {k === "today" ? (base.isToday ? "Aujourd'hui" : "Prochain jour") : "Demain"}
            </button>
          ))}
        </div>
      </PageHero>

      {!shownHasData ? (
        <p className="card mt-6 p-4">
          Aucune session prévue ce jour-là.{" "}
          <Link href="/programme" className="font-semibold underline underline-offset-2">Voir tout le programme</Link>
        </p>
      ) : cards === null ? (
        load?.error && load.day === shown ? (
          <p className="card mt-6 p-4" role="status">Impossible de charger les sessions. Vérifie ta connexion.</p>
        ) : (
          <Skeleton />
        )
      ) : (
        <>
          <div className="mt-3">
            <FilterChips value={filters} onChange={changeFilters} sports={daySports} />
          </div>
          {filtered.length === 0 && (
            <p className="card mt-4 p-4">
              Aucune session ne correspond à ces filtres.{" "}
              <button type="button" className="font-semibold underline underline-offset-2" onClick={() => changeFilters(EMPTY_FILTERS)}>
                Tout afficher
              </button>
            </p>
          )}
          {now === null && initial.isToday && shown === initial.day ? (
            // HTML pré-rendu : la liste complète (visible sans JS) + les sections masquées que
            // PREPAINT remplit avant l'affichage. Même rendu que le mode navigateur ci-dessous.
            <div id="today-sections" data-day={initial.day ?? ""}>
              <Section title="Au programme" cards={filtered} sec="all" tagged />
              <Section title="En ce moment" tone="live" cards={filtered} live sec="live" hidden />
              <Section title="Plus tard aujourd'hui" cards={filtered} sec="later" hidden />
              <DoneSection cards={filtered} sec="done" hidden />
              <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
            </div>
          ) : (
            // la clé remonte la liste au changement d'onglet : les cartes rejouent leur entrée
            <div key={tab}>
              <Section title="En ce moment" tone="live" cards={live} live now={now} animate={animate} />
              <Section title={isLiveDay ? "Plus tard aujourd'hui" : "Au programme"} cards={later} now={isLiveDay ? now : null} animate={animate} />
              <DoneSection cards={done} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

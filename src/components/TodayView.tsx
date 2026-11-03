"use client";

// Accueil. Les sessions du jour du build sont pré-rendues en HTML (`initial`) : sans JS, ou
// avant l'hydratation, elles s'affichent en une seule liste « Au programme ». Une fois l'heure
// connue dans le navigateur, on les répartit en « En ce moment / Plus tard / Terminé ».
// Le fichier /data/day-….json n'est chargé que si le jour affiché n'est pas celui du build.
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CardData } from "@/lib/cards";
import { applyFilters, EMPTY_FILTERS, type Filters } from "@/lib/filters";
import { addDays, dayKey, longDay } from "@/lib/time";
import { useNow } from "@/lib/useNow";
import { Mascot } from "./Brand";
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
 *  compte à rebours pour ce qui commence dans moins de 3 h. */
function timing(c: CardData, now: number | null): { hint?: string; progress?: number } {
  if (now === null) return {};
  const s = Date.parse(c.start);
  const e = c.end === null ? null : Date.parse(c.end);
  if (s <= now && e !== null && now < e) return { hint: `encore ${duration(e - now)}`, progress: (now - s) / (e - s) };
  if (s > now && s - now < 3 * 3600_000) return { hint: `dans ${duration(s - now)}` };
  return {};
}

function SectionTitle({ title, count, tone }: { title: string; count: number | null; tone?: "live" | "muted" }) {
  return (
    <h2 className={`display mb-3 flex items-center gap-2 text-2xl ${tone === "live" ? "text-red-ink" : tone === "muted" ? "text-muted" : ""}`}>
      {tone === "live" && <span className="live-dot" aria-hidden="true" />}
      {title}
      {count !== null && <span className="rounded-full bg-line-soft px-2 py-0.5 font-sans text-xs font-bold text-muted">{count}</span>}
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
    </h2>
  );
}

function Section({ title, tone, cards, live = false, sec, hidden = false, tagged = false, now = null, animate = false }: {
  title: string; tone?: "live"; cards: CardData[]; live?: boolean;
  sec?: string; hidden?: boolean; tagged?: boolean; now?: number | null; animate?: boolean;
}) {
  if (!cards.length) return null;
  return (
    <section className={`mt-6 ${hidden ? "hidden" : ""}`} data-sec={sec}>
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
    <details className={`group mt-6 ${hidden ? "hidden" : ""}`} data-sec={sec}>
      <summary className="display flex min-h-11 cursor-pointer list-none items-center gap-2 py-2 text-2xl text-muted [&::-webkit-details-marker]:hidden">
        <ChevronRight aria-hidden="true" size={20} className="transition-transform duration-200 group-open:rotate-90" />
        Déjà terminé
        <span className="rounded-full bg-line-soft px-2 py-0.5 font-sans text-xs font-bold">{cards.length}</span>
      </summary>
      <ul className="space-y-3">
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
if(t!==r.getAttribute("data-day"))return;var n=Date.now(),g={live:[],open:[],later:[],done:[]};
r.querySelectorAll('[data-sec="all"] li[data-id]').forEach(function(li){var s=Date.parse(li.getAttribute("data-start")),e=li.getAttribute("data-end");
e=e?Date.parse(e):null;g[s<=n?(e===null?"open":(n<e?"live":"done")):"later"].push(li.getAttribute("data-id"));});
var p="#today-sections ",c=p+'[data-sec="all"]{display:none}';
Object.keys(g).forEach(function(k){var q=p+'[data-sec="'+k+'"]';if(!g[k].length){c+=q+"{display:none}";return;}
c+=q+"{display:block}"+q+" li:not("+g[k].map(function(i){return'[data-id="'+i+'"]';}).join(",")+"){display:none}";});
var st=document.createElement("style");st.id="today-initial";st.textContent=c;document.head.appendChild(st);}catch(x){}})();`;

function Ended() {
  return (
    <div className="card mt-6 flex items-end gap-4 p-4">
      <Mascot height={150} />
      <div>
        <h1 className="display text-5xl text-heading">Les Jeux sont terminés</h1>
        <p className="mt-2 text-muted">Les JOJ Dakar 2026 se sont déroulés du 30 octobre au 13 novembre 2026.</p>
        <Link href="/programme" className="mt-3 inline-flex min-h-11 items-center font-bold text-blue-ink underline">Revoir le programme</Link>
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
  const live = isLiveDay ? filtered.filter((c) => Date.parse(c.start) <= t && c.end !== null && t < Date.parse(c.end)) : [];
  const startedOpen = isLiveDay ? filtered.filter((c) => Date.parse(c.start) <= t && c.end === null) : [];
  const later = isLiveDay ? filtered.filter((c) => Date.parse(c.start) > t) : filtered;
  const done = isLiveDay ? filtered.filter((c) => c.end !== null && Date.parse(c.end) <= t) : [];

  return (
    <div>
      <div className="mt-2">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-ink">
          {tab === "tomorrow" ? "Demain" : base.isToday ? "Aujourd'hui" : "Prochain jour de compétition"}
        </p>
        <h1 className="display mt-1 text-5xl text-heading">{shown ? longDay(shown) : "—"}</h1>
        {cards && cards.length > 0 && (
          <p className="mt-1 text-sm text-muted">
            {cards.length} session{cards.length > 1 ? "s" : ""}
            {live.length > 0 && (
              <>
                {" · "}
                <span className="inline-flex items-center gap-1.5 font-semibold text-red-ink">
                  <span className="live-dot size-1.5" aria-hidden="true" />
                  {live.length} en direct
                </span>
              </>
            )}
          </p>
        )}
      </div>

      <div role="tablist" aria-label="Jour" className="card relative mt-4 grid grid-cols-2 rounded-full p-1">
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-blue shadow-md shadow-blue/30 transition-transform duration-300 [transition-timing-function:var(--ease)]"
          style={{ transform: tab === "tomorrow" ? "translateX(100%)" : undefined }}
        />
        {(["today", "tomorrow"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={tab === k}
            onClick={() => changeTab(k)}
            className={`relative z-10 min-h-11 rounded-full text-base font-bold transition-colors duration-300 ${tab === k ? "text-on-blue" : "text-ink"}`}
          >
            {k === "today" ? (base.isToday ? "Aujourd'hui" : "Prochain jour") : "Demain"}
          </button>
        ))}
      </div>

      {!shownHasData ? (
        <p className="card mt-6 p-4">
          Aucune session prévue ce jour-là.{" "}
          <Link href="/programme" className="font-bold text-blue-ink underline">Voir tout le programme</Link>
        </p>
      ) : cards === null ? (
        load?.error && load.day === shown ? (
          <p className="card mt-6 p-4" role="status">Impossible de charger les sessions. Vérifie ta connexion.</p>
        ) : (
          <Skeleton />
        )
      ) : (
        <>
          <FilterChips value={filters} onChange={changeFilters} sports={daySports} />
          {filtered.length === 0 && (
            <p className="card mt-4 p-4">
              Aucune session ne correspond à ces filtres.{" "}
              <button type="button" className="font-bold text-blue-ink underline" onClick={() => changeFilters(EMPTY_FILTERS)}>
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
              <Section title="Déjà commencé" cards={filtered} sec="open" hidden />
              <Section title="Plus tard aujourd'hui" cards={filtered} sec="later" hidden />
              <DoneSection cards={filtered} sec="done" hidden />
              <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
            </div>
          ) : (
            // la clé remonte la liste au changement d'onglet : les cartes rejouent leur entrée
            <div key={tab}>
              <Section title="En ce moment" tone="live" cards={live} live now={now} animate={animate} />
              <Section title="Déjà commencé" cards={startedOpen} now={now} animate={animate} />
              <Section title={isLiveDay ? "Plus tard aujourd'hui" : "Au programme"} cards={later} now={isLiveDay ? now : null} animate={animate} />
              <DoneSection cards={done} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CardData } from "@/lib/cards";
import { applyFilters, EMPTY_FILTERS, type Filters } from "@/lib/filters";
import { addDays, dayKey, longDay } from "@/lib/time";
import { useNow } from "@/lib/useNow";
import { FilterChips } from "./FilterChips";
import { SessionCard } from "./SessionCard";

type SportChip = { id: string; label: string; emoji: string };
type Load = { day: string; cards: CardData[] | null; error: boolean };

/** Jour à afficher pour « Aujourd'hui » : le jour même s'il a des sessions,
 *  sinon le prochain jour qui en a (avant ou pendant les Jeux), sinon null (Jeux terminés). */
function pickDay(today: string, days: string[]): { day: string | null; isToday: boolean } {
  if (days.includes(today)) return { day: today, isToday: true };
  const next = days.find((d) => d > today);
  return { day: next ?? null, isToday: false };
}

function Section({ title, tone, cards, live = false }: { title: string; tone?: "live"; cards: CardData[]; live?: boolean }) {
  if (!cards.length) return null;
  return (
    <section className="mt-5">
      <h2 className={`mb-2 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide ${tone === "live" ? "text-red" : "text-muted"}`}>
        {tone === "live" && <span className="size-2.5 rounded-full bg-red motion-safe:animate-pulse" aria-hidden="true" />}
        {title} <span className="font-semibold">({cards.length})</span>
      </h2>
      <ul className="space-y-2.5">
        {cards.map((c) => (
          <li key={c.id}><SessionCard c={c} live={live} /></li>
        ))}
      </ul>
    </section>
  );
}

export function TodayView({ days, sports }: { days: string[]; sports: SportChip[] }) {
  const now = useNow();
  const [tab, setTab] = useState<"today" | "tomorrow">("today");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [load, setLoad] = useState<Load | null>(null);

  const today = now === null ? null : dayKey(new Date(now));
  const base = today === null ? null : pickDay(today, days);
  const tomorrow = base?.day ? (base.isToday ? addDays(base.day, 1) : days.find((d) => d > base.day!) ?? null) : null;
  const shown = tab === "today" ? base?.day ?? null : tomorrow;
  const shownHasData = shown !== null && days.includes(shown);

  useEffect(() => {
    if (!shown || !shownHasData) return;
    let cancelled = false;
    fetch(`/data/day-${shown}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((cards: CardData[]) => !cancelled && setLoad({ day: shown, cards, error: false }))
      .catch(() => !cancelled && setLoad({ day: shown, cards: null, error: true }));
    return () => {
      cancelled = true;
    };
  }, [shown, shownHasData]);

  const cards = load?.day === shown ? load.cards : null;
  const filtered = useMemo(() => (cards ? applyFilters(cards, filters) : []), [cards, filters]);
  const daySports = useMemo(
    () => (cards ? sports.filter((s) => cards.some((c) => c.sportId === s.id)) : []),
    [cards, sports],
  );

  if (now === null) {
    return <p className="mt-6 text-muted">Chargement du programme du jour…</p>;
  }

  if (base?.day === null) {
    return (
      <div className="mt-6 rounded-xl bg-surface p-4">
        <h1 className="text-2xl font-extrabold">Les Jeux sont terminés</h1>
        <p className="mt-2 text-muted">Les JOJ Dakar 2026 se sont déroulés du 30 octobre au 13 novembre 2026.</p>
        <Link href="/programme" className="mt-3 inline-block font-bold text-green-ink underline">Revoir le programme</Link>
      </div>
    );
  }

  const isLiveDay = tab === "today" && base?.isToday;
  const t = now;
  const live = isLiveDay ? filtered.filter((c) => Date.parse(c.start) <= t && c.end !== null && t < Date.parse(c.end)) : [];
  const startedOpen = isLiveDay ? filtered.filter((c) => Date.parse(c.start) <= t && c.end === null) : [];
  const later = isLiveDay ? filtered.filter((c) => Date.parse(c.start) > t) : filtered;
  const done = isLiveDay ? filtered.filter((c) => c.end !== null && Date.parse(c.end) <= t) : [];

  return (
    <div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted">
            {tab === "today" && !base?.isToday ? "Prochain jour de compétition" : tab === "today" ? "Aujourd'hui" : "Demain"}
          </p>
          <h1 className="text-2xl font-extrabold first-letter:uppercase">{shown ? longDay(shown) : "—"}</h1>
        </div>
      </div>

      <div role="tablist" aria-label="Jour" className="mt-3 grid grid-cols-2 rounded-xl bg-surface p-1 border border-line">
        {(["today", "tomorrow"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`min-h-11 rounded-lg text-base font-bold ${tab === k ? "bg-green text-on-accent" : "text-ink"}`}
          >
            {k === "today" ? (base?.isToday ? "Aujourd'hui" : "Prochain jour") : "Demain"}
          </button>
        ))}
      </div>

      {!shownHasData ? (
        <p className="mt-6 rounded-xl bg-surface p-4">
          Aucune session prévue ce jour-là.{" "}
          <Link href="/programme" className="font-bold text-green-ink underline">Voir tout le programme</Link>
        </p>
      ) : cards === null ? (
        <p className="mt-6 text-muted" role="status">
          {load?.error && load.day === shown ? "Impossible de charger les sessions. Vérifie ta connexion." : "Chargement…"}
        </p>
      ) : (
        <>
          <FilterChips value={filters} onChange={setFilters} sports={daySports} />
          {filtered.length === 0 && (
            <p className="mt-4 rounded-xl bg-surface p-4">
              Aucune session ne correspond à ces filtres.{" "}
              <button type="button" className="font-bold text-green-ink underline" onClick={() => setFilters(EMPTY_FILTERS)}>
                Tout afficher
              </button>
            </p>
          )}
          <Section title="En ce moment" tone="live" cards={live} live />
          <Section title="Commencé · fin non communiquée" cards={startedOpen} />
          <Section title={isLiveDay ? "Plus tard aujourd'hui" : "Au programme"} cards={later} />
          {done.length > 0 && (
            <details className="mt-5">
              <summary className="min-h-11 cursor-pointer py-2 text-sm font-extrabold uppercase tracking-wide text-muted">
                Déjà terminé ({done.length})
              </summary>
              <ul className="space-y-2.5">
                {done.map((c) => (
                  <li key={c.id} className="opacity-70"><SessionCard c={c} /></li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}

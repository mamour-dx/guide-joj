"use client";

// Contrôles du programme. Les cartes sont rendues en HTML statique par le serveur avec des
// attributs data-* ; ici on ne fait que générer une règle CSS qui masque ce qui ne correspond
// pas aux filtres de l'URL. Aucune donnée n'est dupliquée côté client, et sans JS tout s'affiche.
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { activeCount, EMPTY_FILTERS, filtersFromParams, filtersToParams, type Filters } from "@/lib/filters";
import { programmeCss } from "@/lib/programmeCss";
import { dayKey, shortDay } from "@/lib/time";
import { useNow } from "@/lib/useNow";
import { FilterChips } from "./FilterChips";

type SportChip = { id: string; label: string; emoji: string };

export function ProgrammeControls({ days, sports }: { days: string[]; sports: SportChip[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const now = useNow();
  const filters = useMemo(() => filtersFromParams(new URLSearchParams(params.toString())), [params]);
  const [q, setQ] = useState(filters.q);
  const stripRef = useRef<HTMLDivElement>(null);

  // Jour : celui de l'URL, sinon aujourd'hui (à Dakar) s'il a des sessions, sinon le prochain.
  const urlDay = params.get("jour");
  const today = now === null ? null : dayKey(new Date(now));
  const fallbackDay = today === null ? null : days.includes(today) ? today : days.find((d) => d > today) ?? days[days.length - 1];
  const day = urlDay && days.includes(urlDay) ? urlDay : fallbackDay;

  function push(f: Filters, jour?: string) {
    const p = filtersToParams(f, new URLSearchParams(params.toString()));
    if (jour) p.set("jour", jour);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // recherche : on attend que la frappe s'arrête avant de toucher l'URL
  useEffect(() => {
    if (q === filters.q) return;
    const id = setTimeout(() => push({ ...filters, q }), 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // le style posé avant l'hydratation (voir programme/page.tsx) n'est plus utile
  useEffect(() => {
    if (day) document.getElementById("prog-initial")?.remove();
  }, [day]);

  useEffect(() => {
    stripRef.current?.querySelector<HTMLElement>("[aria-current]")?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [day]);

  const css = programmeCss(params.toString(), days, today);
  const searching = filters.q.trim().length > 0;

  return (
    <>
      <style>{css}</style>
      {/* seul le bandeau de jours reste collé en haut : la recherche et les puces défilent */}
      <div className="sticky top-0 z-10 -mx-4 bg-page/95 px-4 py-2 backdrop-blur">
      <div ref={stripRef} className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4" aria-label="Jours">
        {days.map((d) => {
          const { weekday, num } = shortDay(d);
          const active = !searching && d === day;
          const p = new URLSearchParams(params.toString());
          p.set("jour", d);
          return (
            <Link
              key={d}
              href={`${pathname}?${p.toString()}`}
              replace
              scroll={false}
              aria-current={active ? "date" : undefined}
              className={`pressable relative flex min-h-14 min-w-12 shrink-0 flex-col items-center justify-center border-2 border-line px-2 text-sm leading-tight ${
                active ? "bg-ink text-page" : "bg-surface hover:bg-tint"
              }`}
            >
              <span className="font-mono text-xs">{weekday}</span>
              <span className="tabular display text-2xl">{num}</span>
              {d === today && (
                <span className="absolute inset-x-0 top-0 h-1 bg-o-red" aria-label="aujourd'hui" />
              )}
            </Link>
          );
        })}
      </div>
      </div>

      <label className="mt-1 flex min-h-12 items-center gap-2 border-2 border-line bg-surface px-3 transition focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-o-red">
        <Search aria-hidden="true" size={18} className="text-ink" />
        <span className="sr-only">Rechercher</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Sport, pays (SEN), épreuve (100 m)…"
          className="min-w-0 flex-1 bg-transparent py-2 font-mono text-base outline-none placeholder:text-muted"
          enterKeyHint="search"
        />
        {q && (
          <button type="button" aria-label="Effacer la recherche" onClick={() => setQ("")} className="pop flex size-8 items-center justify-center bg-ink text-page transition active:translate-y-px">
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </label>
      {searching && <p className="eyebrow mt-1 text-muted">Recherche sur tous les jours.</p>}

      <FilterChips value={filters} onChange={(f) => push(f)} sports={sports} />
      {activeCount(filters) > 0 && (
        <button type="button" onClick={() => { setQ(""); push(EMPTY_FILTERS); }} className="min-h-11 text-sm font-semibold underline underline-offset-2">
          Effacer les filtres ({activeCount(filters)})
        </button>
      )}
    </>
  );
}

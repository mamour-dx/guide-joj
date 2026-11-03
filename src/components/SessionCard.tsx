// Carte session. Sans hook : rendue côté serveur (programme, sites) comme côté client (accueil).
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CardData } from "@/lib/cards";
import { CLUSTER_LABEL } from "@/lib/cards";
import type { Cluster } from "@/lib/schema";
import { timeRange } from "@/lib/time";
import { SportPicto } from "./Brand";

/** Repère de secteur : carré de couleur olympique (rouge Dakar, vert Diamniadio, jaune Saly,
 *  comme le plan directeur du guide médias), bordé de noir. Le texte reste noir. */
export const CLUSTER_DOT: Record<Cluster, string> = {
  dakar: "bg-o-red",
  diamniadio: "bg-o-green",
  saly: "bg-o-yellow",
};

export function ClusterTag({ cluster, prefix = "" }: { cluster: Cluster; prefix?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-ink">
      <span className={`inline-block size-2.5 ring-1 ring-black ${CLUSTER_DOT[cluster]}`} aria-hidden="true" />
      {prefix}
      {CLUSTER_LABEL[cluster]}
    </span>
  );
}

export function Badge({ tone, children }: { tone: "free" | "final" | "live" | "warn" | "soldout" | "neutral"; children: React.ReactNode }) {
  const cls = {
    free: "bg-o-yellow text-black",
    final: "bg-ink text-page",
    live: "bg-o-red text-black",
    warn: "ring-2 ring-inset ring-line text-ink",
    soldout: "ring-2 ring-inset ring-red-ink text-red-ink",
    neutral: "ring-2 ring-inset ring-line text-ink",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-xs font-medium uppercase ${cls}`}>
      {tone === "live" && <span className="live-dot size-1.5" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** `hint` : « Dans 25 min », « Encore 40 min »… ; `progress` (0–1) : avancement d'une session
 *  en cours. Tous deux calculés dans le navigateur (accueil), absents ailleurs. */
export function SessionCard({ c, live = false, hint, progress }: { c: CardData; live?: boolean; hint?: string; progress?: number }) {
  return (
    <Link
      href={`/session/${c.id}`}
      // pas de préchargement : une liste peut afficher des dizaines de cartes (data mobile)
      prefetch={false}
      className={`card pressable relative flex gap-3 overflow-hidden p-3 pr-2 ${live ? "!border-o-red" : ""}`}
    >
      <span className="flex size-14 shrink-0 items-center justify-center">
        <SportPicto sportId={c.sportId} emoji={c.emoji} size={56} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="tabular font-mono font-medium">{timeRange(c.start, c.end)}</span>
            {hint && (
              <span className={`tabular whitespace-nowrap font-mono text-xs ${live ? "text-red-ink" : "text-muted"}`}>{hint}</span>
            )}
          </span>
          <span className="tabular bg-ink px-1.5 py-0.5 font-mono text-xs text-page">{c.id}</span>
        </div>
        <p className="display mt-1.5 text-[1.9rem]">{c.label}</p>
        <p className="mt-0.5 text-sm text-muted">
          {c.venueName}
          {c.hall ? ` (${c.hall})` : ""} · <ClusterTag cluster={c.cluster} />
        </p>
        {(live || c.hasFinal || c.isFree || c.soldOut || c.scheduleChanged) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {live && <Badge tone="live">En ce moment</Badge>}
            {c.hasFinal && <Badge tone="final">Finale</Badge>}
            {c.isFree === true && <Badge tone="free">Gratuit</Badge>}
            {c.soldOut && <Badge tone="soldout">Complet</Badge>}
            {c.scheduleChanged && <Badge tone="warn">Horaire modifié</Badge>}
          </div>
        )}
        {c.events.length > 0 && (
          <ul className="mt-2 space-y-0.5 border-t-2 border-dotted border-line-soft pt-2 text-sm">
            {c.events.map((e, i) => (
              <li key={i} className="truncate">{e}</li>
            ))}
            {c.moreEvents > 0 && <li className="text-muted">+{c.moreEvents} épreuve{c.moreEvents > 1 ? "s" : ""}</li>}
          </ul>
        )}
      </div>
      <ChevronRight aria-hidden="true" size={20} className="nudge shrink-0 self-center text-muted" />
      {progress !== undefined && (
        <span
          className="absolute inset-x-0 bottom-0 h-1.5 bg-o-red/20"
          role="progressbar"
          aria-label="Avancement de la session"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <span className="block h-full bg-o-red transition-[width] duration-700" style={{ width: `${progress * 100}%` }} />
        </span>
      )}
    </Link>
  );
}

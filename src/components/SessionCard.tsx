// Carte session. Sans hook : rendue côté serveur (programme, sites) comme côté client (accueil).
import Link from "next/link";
import type { CardData } from "@/lib/cards";
import { CLUSTER_LABEL } from "@/lib/cards";
import type { Cluster } from "@/lib/schema";
import { timeRange } from "@/lib/time";
import { SportPicto } from "./Brand";

/** Repère de secteur : carré de couleur olympique (rouge Dakar, vert Diamniadio, jaune Saly,
 *  comme le plan directeur du guide médias). Le texte reste noir. */
export const CLUSTER_DOT: Record<Cluster, string> = {
  dakar: "bg-o-red",
  diamniadio: "bg-o-green",
  saly: "bg-o-yellow",
};

export function ClusterTag({ cluster, prefix = "" }: { cluster: Cluster; prefix?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
      <span className={`inline-block size-2.5 ${CLUSTER_DOT[cluster]}`} aria-hidden="true" />
      {prefix}
      {CLUSTER_LABEL[cluster]}
    </span>
  );
}

export function Badge({ tone, children }: { tone: "free" | "final" | "live" | "warn" | "soldout" | "neutral"; children: React.ReactNode }) {
  const cls = {
    free: "bg-o-yellow text-black",
    final: "bg-ink text-page",
    live: "bg-red-ink text-white",
    warn: "border border-ink text-ink",
    soldout: "border border-red-ink text-red-ink",
    neutral: "border border-line text-ink",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide ${cls}`}>
      {tone === "live" && <span className="size-1.5 rounded-full bg-white motion-safe:animate-pulse" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function SessionCard({ c, live = false }: { c: CardData; live?: boolean }) {
  return (
    <Link
      href={`/session/${c.id}`}
      // pas de préchargement : une liste peut afficher des dizaines de cartes (data mobile)
      prefetch={false}
      className="chamfer flex gap-3 bg-tint p-3 pr-4 transition active:scale-[0.99]"
    >
      <SportPicto sportId={c.sportId} emoji={c.emoji} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="tabular font-bold">
            {timeRange(c.start, c.end)}
          </span>
          <span className="tabular text-xs font-bold tracking-wider text-blue-ink">{c.id}</span>
        </div>
        <p className="display mt-1 text-[1.75rem]">{c.label}</p>
        <p className="mt-1 text-sm text-muted">
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
          <>
            <div className="dotted-x mt-2.5" aria-hidden="true" />
            <ul className="mt-2 space-y-0.5 text-sm">
              {c.events.map((e, i) => (
                <li key={i} className="truncate">{e}</li>
              ))}
              {c.moreEvents > 0 && <li className="text-muted">+{c.moreEvents} épreuve{c.moreEvents > 1 ? "s" : ""}</li>}
            </ul>
          </>
        )}
      </div>
    </Link>
  );
}

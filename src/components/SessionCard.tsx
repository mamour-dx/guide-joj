// Carte session. Sans hook : rendue côté serveur (programme, sites) comme côté client (accueil).
import Link from "next/link";
import type { CardData } from "@/lib/cards";
import { CLUSTER_LABEL } from "@/lib/cards";
import type { Cluster } from "@/lib/schema";
import { timeRange } from "@/lib/time";

export const CLUSTER_STYLE: Record<Cluster, { border: string; dot: string; text: string }> = {
  dakar: { border: "border-l-green", dot: "bg-green", text: "text-green-ink" },
  diamniadio: { border: "border-l-sun", dot: "bg-sun", text: "text-sun-ink" },
  saly: { border: "border-l-ocean", dot: "bg-ocean", text: "text-ocean" },
};

export function Badge({ tone, children }: { tone: "free" | "final" | "live" | "warn"; children: React.ReactNode }) {
  const cls = {
    free: "bg-yellow text-[#14161A]",
    final: "bg-green-soft text-green-ink",
    live: "bg-red text-on-red",
    warn: "border border-current text-sun-ink",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${cls}`}>{children}</span>;
}

export function SessionCard({ c, live = false }: { c: CardData; live?: boolean }) {
  const style = CLUSTER_STYLE[c.cluster];
  return (
    <Link
      href={`/session/${c.id}`}
      // pas de préchargement : une liste peut afficher des dizaines de cartes (data mobile)
      prefetch={false}
      className={`block rounded-xl border border-line border-l-4 ${style.border} bg-surface p-3 shadow-sm active:scale-[0.99] transition`}
    >
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="tabular font-bold">
          {timeRange(c.start, c.end)}
          {c.end === null && <span className="font-normal text-muted"> · fin ?</span>}
        </span>
        <span className="tabular text-xs font-semibold tracking-wide text-muted">{c.id}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-lg font-extrabold leading-tight">
        <span>{c.label}</span>
        <span aria-hidden="true">{c.emoji}</span>
      </div>
      <div className="mt-0.5 text-sm text-muted">
        {c.venueName}
        {c.hall ? ` (${c.hall})` : ""} ·{" "}
        <span className={`font-semibold ${style.text}`}>
          <span className={`mr-1 inline-block size-2 rounded-full align-middle ${style.dot}`} aria-hidden="true" />
          {CLUSTER_LABEL[c.cluster]}
        </span>
      </div>
      {(live || c.hasFinal || c.isFree || c.scheduleChanged) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {live && <Badge tone="live">En ce moment</Badge>}
          {c.hasFinal && <Badge tone="final">Finale</Badge>}
          {c.isFree === true && <Badge tone="free">Gratuit</Badge>}
          {c.scheduleChanged && <Badge tone="warn">Horaire modifié</Badge>}
        </div>
      )}
      {c.events.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-sm">
          {c.events.map((e, i) => (
            <li key={i} className="truncate">{e}</li>
          ))}
          {c.moreEvents > 0 && <li className="text-muted">+{c.moreEvents} épreuve{c.moreEvents > 1 ? "s" : ""}</li>}
        </ul>
      )}
    </Link>
  );
}

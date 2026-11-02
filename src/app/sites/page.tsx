import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CLUSTER_STYLE } from "@/components/SessionCard";
import { RemainingCount } from "@/components/TimeAware";
import { CLUSTER_LABEL, CLUSTERS } from "@/lib/cards";
import { sessions, venues } from "@/lib/data";

export const metadata: Metadata = {
  title: "Sites",
  description: "Les 8 sites des JOJ Dakar 2026 : Dakar, Diamniadio et Saly. Accès, itinéraire et sessions à venir.",
};

export default function SitesPage() {
  return (
    <>
      <h1 className="mt-2 text-2xl font-extrabold">Sites</h1>
      <p className="mt-1 text-muted">{venues.length} sites, 3 secteurs.</p>
      {CLUSTERS.map((cl) => {
        const list = venues.filter((v) => v.cluster === cl);
        const style = CLUSTER_STYLE[cl];
        return (
          <section key={cl} className="mt-5">
            <h2 className={`mb-2 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide ${style.text}`}>
              <span className={`size-2.5 rounded-full ${style.dot}`} aria-hidden="true" />
              {CLUSTER_LABEL[cl]}
            </h2>
            <ul className="space-y-2.5">
              {list.map((v) => {
                const vs = sessions.filter((s) => s.venueId === v.id);
                return (
                  <li key={v.id}>
                    <Link
                      href={`/sites/${v.id}`}
                      className={`flex min-h-16 items-center justify-between gap-3 rounded-xl border border-line border-l-4 ${style.border} bg-surface p-3`}
                    >
                      <span>
                        <span className="block text-lg font-extrabold leading-tight">{v.name}</span>
                        <span className="text-sm text-muted">
                          <RemainingCount ends={vs.map((s) => s.end ?? s.start)} total={vs.length} />
                        </span>
                      </span>
                      <ChevronRight aria-hidden="true" className="shrink-0 text-muted" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}

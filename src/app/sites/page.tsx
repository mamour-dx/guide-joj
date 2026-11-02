import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CLUSTER_DOT } from "@/components/SessionCard";
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
      <h1 className="mt-2 display text-5xl text-heading">Sites</h1>
      <p className="mt-1 text-muted">{venues.length} sites, 3 secteurs.</p>
      {CLUSTERS.map((cl) => {
        const list = venues.filter((v) => v.cluster === cl);
        return (
          <section key={cl} className="mt-5">
            <h2 className="display mb-3 flex items-center gap-2 text-3xl">
              <span className={`size-3.5 ${CLUSTER_DOT[cl]}`} aria-hidden="true" />
              {CLUSTER_LABEL[cl]}
              <span className="h-px flex-1 bg-line" aria-hidden="true" />
            </h2>
            <ul className="space-y-2.5">
              {list.map((v) => {
                const vs = sessions.filter((s) => s.venueId === v.id);
                return (
                  <li key={v.id}>
                    <Link
                      href={`/sites/${v.id}`}
                      className="chamfer flex min-h-16 items-center justify-between gap-3 bg-tint p-3 pr-4"
                    >
                      <span>
                        <span className="block display text-[1.75rem]">{v.name}</span>
                        <span className="text-sm text-muted">
                          <RemainingCount ends={vs.map((s) => s.end ?? s.start)} total={vs.length} />
                        </span>
                      </span>
                      <ChevronRight aria-hidden="true" className="shrink-0 text-blue-ink" />
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

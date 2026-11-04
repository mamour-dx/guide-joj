import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CLUSTER_DOT } from "@/components/SessionCard";
import type { MapVenue } from "@/components/SitesMap";
import { PageHero } from "@/components/PageHero";
import { SitesView } from "@/components/SitesView";
import { RemainingCount } from "@/components/TimeAware";
import { CLUSTER_LABEL, CLUSTERS } from "@/lib/cards";
import { sessions, venues, homeOgImage } from "@/lib/data";
import { pageSeo } from "@/lib/seo";
import { mapsUrl } from "@/lib/site";
import { endMs } from "@/lib/time";

export const metadata: Metadata = {
  title: "Sites",
  description: "Les 8 sites des JOJ Dakar 2026 : Dakar, Diamniadio et Saly. Accès, itinéraire et sessions à venir.",
  ...pageSeo("/sites", [homeOgImage]),
};

function endsOf(venueId: string) {
  return sessions.filter((s) => s.venueId === venueId).map((s) => new Date(endMs(s.start, s.end)).toISOString());
}

// sur la carte : seulement les sites dont les coordonnées ont été vérifiées
const mapVenues: MapVenue[] = venues.flatMap((v) =>
  v.lat === null || v.lng === null
    ? []
    : [{
        id: v.id,
        name: v.name,
        shortName: v.name.replace(/\s*\(.*\)$/, ""),
        cluster: v.cluster,
        lat: v.lat,
        lng: v.lng,
        routeUrl: mapsUrl(v),
        ends: endsOf(v.id),
        total: endsOf(v.id).length,
      }],
);

export default function SitesPage() {
  return (
    <>
      <PageHero tone="red" eyebrow="Où ça se passe ?" title="Les sites.">
        <p className="eyebrow mt-3">{venues.length} sites · 3 secteurs · Dakar, Diamniadio, Saly</p>
      </PageHero>
      <SitesView venues={mapVenues} unplaced={venues.length - mapVenues.length}>
      {CLUSTERS.map((cl) => {
        const list = venues.filter((v) => v.cluster === cl);
        return (
          <section key={cl} className="mt-8">
            <h2 className="display mb-3 flex items-center gap-2 border-b-2 border-line pb-2 text-4xl">
              <span className={`size-4 ring-1 ring-black ${CLUSTER_DOT[cl]}`} aria-hidden="true" />
              {CLUSTER_LABEL[cl]}.
            </h2>
            <ul className="space-y-2.5">
              {list.map((v) => {
                const ends = endsOf(v.id);
                return (
                  <li key={v.id}>
                    <Link
                      href={`/sites/${v.id}`}
                      className="card pressable flex min-h-16 items-center justify-between gap-3 p-4"
                    >
                      <span>
                        <span className="block display text-[1.75rem]">{v.name}</span>
                        <span className="eyebrow text-muted">
                          <RemainingCount ends={ends} total={ends.length} />
                        </span>
                      </span>
                      <ChevronRight aria-hidden="true" className="nudge shrink-0 text-muted" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      </SitesView>
    </>
  );
}

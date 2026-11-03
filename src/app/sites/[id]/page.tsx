import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, MapPinned } from "lucide-react";
import { BackLink } from "@/components/BackLink";
import { ClusterTag, SessionCard } from "@/components/SessionCard";
import { HidePastDays } from "@/components/TimeAware";
import { CLUSTER_LABEL } from "@/lib/cards";
import { cards, homeOgImage, officialLinks, venueById, venues } from "@/lib/data";
import { breadcrumbJsonLd, JsonLd, pageSeo, venueJsonLd } from "@/lib/seo";
import { mapsUrl } from "@/lib/site";
import { dakarToday } from "@/lib/programmeCss";
import { longDay } from "@/lib/time";

export async function generateStaticParams() {
  return venues.map((v) => ({ id: v.id }));
}

export async function generateMetadata({ params }: PageProps<"/sites/[id]">): Promise<Metadata> {
  const { id } = await params;
  const v = venueById.get(id);
  if (!v) return {};
  return {
    title: v.name,
    description: `${v.name} (${CLUSTER_LABEL[v.cluster]}) : accès, itinéraire et sessions des JOJ Dakar 2026.`,
    ...pageSeo(`/sites/${v.id}`, [homeOgImage]),
  };
}

export default async function SitePage({ params }: PageProps<"/sites/[id]">) {
  const { id } = await params;
  const v = venueById.get(id);
  if (!v) notFound();
  const list = cards.filter((c) => c.venueId === v.id);
  const days = [...new Set(list.map((c) => c.day))];
  const scope = `site-${v.id}`;

  return (
    <article className="pt-2">
      <JsonLd
        data={[
          venueJsonLd(v),
          breadcrumbJsonLd([
            { name: "Sites", path: "/sites" },
            { name: v.name, path: `/sites/${v.id}` },
          ]),
        ]}
      />
      <BackLink href="/sites" />
      <h1 className="mt-1 display text-5xl text-heading">{v.name}</h1>
      <p className="mt-2">
        <ClusterTag cluster={v.cluster} prefix="Secteur " />
      </p>

      <a
        href={mapsUrl(v)}
        target="_blank"
        rel="noopener"
        className="pressable mt-4 flex min-h-16 w-full items-center gap-3 rounded-2xl bg-blue px-4 py-3 text-on-blue shadow-lg shadow-blue/25"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20">
          <MapPinned aria-hidden="true" size={22} />
        </span>
        <span className="flex-1 text-left">
          <span className="display block text-2xl">Itinéraire</span>
          <span className="block text-sm font-semibold opacity-90">S&apos;ouvre dans Google Maps</span>
        </span>
        <ArrowUpRight aria-hidden="true" size={22} className="nudge" />
      </a>
      {(v.lat === null || v.lng === null) && (
        <p className="mt-1 text-xs text-muted">
          L&apos;itinéraire mène au lieu « {v.mapsQuery} » sur Google Maps ; l&apos;entrée est signalée sur place.
        </p>
      )}

      <section className="card mt-5 p-4">
        <h2 className="display text-2xl">Accès</h2>
        {v.accessNote ? (
          <p className="mt-1">
            {v.accessNote}
            {v.accessSourceUrl && (
              <>
                {" "}(<a href={v.accessSourceUrl} target="_blank" rel="noopener" className="underline">source</a>)
              </>
            )}
          </p>
        ) : (
          <p className="mt-1">
            Note d&apos;accès à vérifier. Consulte le{" "}
            <a href={officialLinks.mobilityGuide} target="_blank" rel="noopener" className="font-semibold underline">
              guide mobilité officiel (PDF)
            </a>{" "}
            pour les déviations et les accès.
          </p>
        )}
      </section>

      <section id={scope} className="mt-6">
        <h2 className="display text-2xl">Sessions ({list.length})</h2>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var dakarToday=${dakarToday.toString()};var t=dakarToday();var s=document.createElement("style");s.id="past-initial";s.textContent=${JSON.stringify(days)}.filter(function(d){return d<t}).map(function(d){return '#${scope} [data-past-day="'+d+'"]{display:none}'}).join("");document.head.appendChild(s);}catch(e){}})();`,
          }}
        />
        <HidePastDays scope={scope} days={days} />
        {days.map((d) => (
          <div key={d} data-past-day={d}>
            <h3 className="mt-4 mb-2 display text-2xl">{longDay(d)}</h3>
            <ul className="space-y-2.5">
              {list.filter((c) => c.day === d).map((c) => (
                <li key={c.id}><SessionCard c={c} /></li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </article>
  );
}

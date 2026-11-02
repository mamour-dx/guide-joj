import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { BackLink } from "@/components/BackLink";
import { CLUSTER_STYLE, SessionCard } from "@/components/SessionCard";
import { HidePastDays } from "@/components/TimeAware";
import { CLUSTER_LABEL } from "@/lib/cards";
import { cards, officialLinks, venueById, venues } from "@/lib/data";
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
  return { title: v.name, description: `${v.name} (${CLUSTER_LABEL[v.cluster]}) : accès, itinéraire et sessions des JOJ Dakar 2026.` };
}

export default async function SitePage({ params }: PageProps<"/sites/[id]">) {
  const { id } = await params;
  const v = venueById.get(id);
  if (!v) notFound();
  const style = CLUSTER_STYLE[v.cluster];
  const list = cards.filter((c) => c.venueId === v.id);
  const days = [...new Set(list.map((c) => c.day))];
  const scope = `site-${v.id}`;

  return (
    <article className="pt-2">
      <BackLink href="/sites" />
      <h1 className="mt-1 text-3xl font-extrabold leading-tight">{v.name}</h1>
      <p className={`mt-1 font-semibold ${style.text}`}>
        <span className={`mr-1.5 inline-block size-2.5 rounded-full align-middle ${style.dot}`} aria-hidden="true" />
        Secteur {CLUSTER_LABEL[v.cluster]}
      </p>

      <a
        href={mapsUrl(v)}
        target="_blank"
        rel="noopener"
        className="mt-4 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-green px-4 py-3 text-lg font-extrabold text-on-accent"
      >
        Itinéraire <ArrowUpRight aria-hidden="true" size={20} />
      </a>
      {(v.lat === null || v.lng === null) && (
        <p className="mt-1 text-xs text-muted">Position GPS non vérifiée : l&apos;itinéraire cherche « {v.mapsQuery} ».</p>
      )}

      <section className="mt-5 rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted">Accès</h2>
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
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted">Sessions ({list.length})</h2>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var dakarToday=${dakarToday.toString()};var t=dakarToday();var s=document.createElement("style");s.id="past-initial";s.textContent=${JSON.stringify(days)}.filter(function(d){return d<t}).map(function(d){return '#${scope} [data-past-day="'+d+'"]{display:none}'}).join("");document.head.appendChild(s);}catch(e){}})();`,
          }}
        />
        <HidePastDays scope={scope} days={days} />
        {days.map((d) => (
          <div key={d} data-past-day={d}>
            <h3 className="mt-4 mb-2 font-extrabold first-letter:uppercase">{longDay(d)}</h3>
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

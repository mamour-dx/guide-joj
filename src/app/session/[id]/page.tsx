import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, TriangleAlert } from "lucide-react";
import { BackLink } from "@/components/BackLink";
import { PageHero } from "@/components/PageHero";
import { SportPicto } from "@/components/Brand";
import { Badge, ClusterTag } from "@/components/SessionCard";
import { SessionActions } from "@/components/SessionActions";
import { CLUSTER_LABEL } from "@/lib/cards";
import { officialLinks, sessionById, sessionLabel, sessions, ticketsFetchedAt, venueById } from "@/lib/data";
import type { Session } from "@/lib/schema";
import { breadcrumbJsonLd, JsonLd, pageSeo, sessionJsonLd } from "@/lib/seo";
import { mapsUrl } from "@/lib/site";
import { dayKey, hhmm, longDay, timeRange, updatedAt } from "@/lib/time";

export async function generateStaticParams() {
  return sessions.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/session/[id]">): Promise<Metadata> {
  const { id } = await params;
  const s = sessionById.get(id);
  if (!s) return {};
  const { label } = sessionLabel(s);
  const v = venueById.get(s.venueId)!;
  return {
    title: `${label} ${s.id} — ${longDay(dayKey(s.start))}`,
    description: `${label} (${s.id}), ${longDay(dayKey(s.start))} à ${hhmm(s.start)}, ${v.name}. ${s.events.slice(0, 3).join(" · ")}`,
    ...pageSeo(`/session/${s.id}`),
  };
}

const STATUS_LABEL: Record<Session["ticketStatus"], string | null> = {
  available: "Places disponibles",
  limited: "Places limitées",
  soldout: "Complet",
  cancelled: "Annulé",
  unknown: null,
};

function TicketCta({ s, mapsHref }: { s: Session; mapsHref: string }) {
  const primary = "btn display min-h-16 w-full px-4 py-3 text-center text-2xl";
  const status = STATUS_LABEL[s.ticketStatus];

  if (s.isFree === true) {
    return (
      <div className="border-2 border-black bg-o-yellow p-4 text-black">
        <div className="flex items-center gap-2">
          <span className="display text-4xl">Gratuit.</span>
          <span className="text-sm">
            Accès libre annoncé par les organisateurs
            {s.freeSource && (
              <>
                {" "}(<a href={s.freeSource} target="_blank" rel="noopener" className="underline">source</a>)
              </>
            )}
          </span>
        </div>
        <a href={mapsHref} target="_blank" rel="noopener" className={`${primary} mt-3 !bg-black !text-[#F6F6F3]`}>
          Comment y aller <ArrowUpRight aria-hidden="true" size={24} className="nudge" />
          <span className="sr-only"> (Google Maps)</span>
        </a>
        <p className="eyebrow mt-2 text-center">Itinéraire dans Google Maps</p>
      </div>
    );
  }

  const href = s.ticketUrl ?? officialLinks.ticketing;
  return (
    <div className="card p-4">
      {/* isFree null = gratuité non annoncée : jamais « Payant » par défaut */}
      <p className="mb-2 flex items-center gap-2 text-sm">
        <span className="inline-flex shrink-0 items-center whitespace-nowrap px-2 py-0.5 font-mono text-xs uppercase ring-2 ring-inset ring-line">Prix : à vérifier</span>
        <span className="text-muted">Tarifs sur la billetterie officielle</span>
      </p>
      {status && (
        <p className={`mb-2 font-semibold ${s.ticketStatus === "soldout" || s.ticketStatus === "cancelled" ? "text-red-ink" : "text-ink"}`}>
          {status}
          {ticketsFetchedAt && (
            <span className="ml-1 text-xs font-normal text-muted">· relevé le {updatedAt(ticketsFetchedAt)}</span>
          )}
        </p>
      )}
      <a href={href} target="_blank" rel="noopener" className={primary}>
        {s.ticketUrl ? "Acheter sur la billetterie officielle" : "Ouvrir la billetterie officielle"}
        <ArrowUpRight aria-hidden="true" size={24} className="nudge shrink-0" />
      </a>
      {!s.ticketUrl &&
        (s.ticketMatch === "venue-day" ? (
          <p className="mt-2 text-center text-sm">
            Billet groupé : cherche <strong>{venueById.get(s.venueId)!.name}</strong> le {longDay(dayKey(s.start))}
            {" "}(un billet pour plusieurs sessions du site).
          </p>
        ) : (
          <p className="mt-2 text-center text-sm">
            Cherche le code <strong className="tabular bg-ink px-1.5 py-0.5 font-mono text-base font-medium text-page">{s.id}</strong>
          </p>
        ))}
      {s.ticketMatch === "none" && s.kind === "sport" && (
        <p className="eyebrow mt-1 text-center text-xs text-muted">Session introuvable dans la billetterie (vente close ou pas de billet).</p>
      )}
    </div>
  );
}

export default async function SessionPage({ params }: PageProps<"/session/[id]">) {
  const { id } = await params;
  const s = sessionById.get(id);
  if (!s) notFound();
  const v = venueById.get(s.venueId)!;
  const { label, emoji } = sessionLabel(s);
  const day = dayKey(s.start);
  const mapsHref = mapsUrl(v);
  const place = `${v.name}${s.hall ? ` (${s.hall})` : ""}`;

  return (
    <article>
      <JsonLd
        data={[
          sessionJsonLd(s, v),
          breadcrumbJsonLd([
            { name: "Programme", path: "/programme" },
            { name: `${label} ${s.id}`, path: `/session/${s.id}` },
          ]),
        ]}
      />
      {/* couleur du secteur : on sait d'un coup d'œil où ça se passe */}
      <PageHero tone={v.cluster === "dakar" ? "red" : v.cluster === "diamniadio" ? "green" : "yellow"} eyebrow={<BackLink href="/" />} title={
        <span className="flex items-end justify-between gap-4">
          <span className="min-w-0">{label}.</span>
          <span className="shrink-0 border-2 border-black">
            <SportPicto sportId={s.sportId} emoji={emoji} size={72} />
          </span>
        </span>
      }>
        <p className="mt-4 flex flex-wrap items-center gap-2">
          <span className="tabular bg-black px-2 py-0.5 font-mono text-base text-[#F6F6F3]">{s.id}</span>
          <span className="eyebrow">Le code à chercher sur la billetterie</span>
        </p>
      </PageHero>

      <div className="card mt-5 p-4">
        <p className="eyebrow uppercase text-muted">{longDay(day)}</p>
        <p className="tabular display mt-1 text-6xl">
          {timeRange(s.start, s.end)}
        </p>
        <div className="my-3 border-t-2 border-dotted border-line-soft" aria-hidden="true" />
        <p>
          <Link href={`/sites/${v.id}`} className="font-bold underline underline-offset-2">{place}</Link>
          <span className="ml-2 text-sm">
            <ClusterTag cluster={v.cluster} />
          </span>
        </p>
        {/* « Gratuit » est déjà dans le bloc d'action juste en dessous */}
        {s.hasFinal && (
          <div className="mt-2 flex gap-1.5">
            <Badge tone="final">Finale</Badge>
          </div>
        )}
      </div>

      {s.scheduleConflict && (
        <div role="note" className="mt-3 flex gap-2 border-2 border-black bg-o-yellow p-3 text-sm text-black">
          <TriangleAlert aria-hidden="true" size={20} className="shrink-0" />
          <p>
            <strong>Horaire modifié.</strong> La billetterie indique un début à{" "}
            <strong className="tabular">{hhmm(s.scheduleConflict.ticketStart)}</strong>. Le programme PDF du 30/10
            annonçait <span className="tabular">{timeRange(s.scheduleConflict.pdfStart, s.scheduleConflict.pdfEnd)}</span>.
            À vérifier sur place.
          </p>
        </div>
      )}

      <div className="mt-4">
        <TicketCta s={s} mapsHref={mapsHref} />
      </div>

      <SessionActions
        mapsHref={mapsHref}
        shareTitle={`${label} ${s.id} — ${longDay(day)} ${hhmm(s.start)}`}
        ics={{
          uid: s.id,
          title: `${label} ${emoji} ${s.id} — JOJ Dakar 2026`,
          start: s.start,
          end: s.end,
          location: `${place}, ${CLUSTER_LABEL[v.cluster]}, Sénégal`,
          description: [...s.events, "", "Horaires à vérifier sur la billetterie officielle."].join("\n"),
        }}
      />

      {s.events.length > 0 && (
        <section className="mt-8">
          <h2 className="display mb-3 flex items-baseline border-b-2 border-line pb-2 text-4xl">
            Épreuves.
            <span className="ml-auto font-mono text-sm font-medium">{String(s.events.length).padStart(2, "0")}</span>
          </h2>
          <ul className="card divide-y-2 divide-dotted divide-line-soft overflow-hidden">
            {s.events.map((e, i) => (
              <li key={i} className="px-4 py-2.5">{e}</li>
            ))}
          </ul>
          <details className="mt-2">
            <summary className="eyebrow min-h-11 cursor-pointer py-2 text-muted">
              Libellés originaux (anglais, programme officiel)
            </summary>
            <ul className="list-disc pl-5 text-sm text-muted" lang="en">
              {s.eventsRaw.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </details>
        </section>
      )}

      <p className="mt-6 text-sm text-muted">
        {s.kind === "sport" ? (
          <>
            Horaires issus du{" "}
            <a href={s.sourceUrl} target="_blank" rel="noopener" className="underline">programme officiel publié le 30/10</a>
            {s.scheduleConflict ? " et de la billetterie officielle" : ""}. À vérifier sur la billetterie.
          </>
        ) : (
          <>
            Informations issues de la{" "}
            <a href={s.sourceUrl} target="_blank" rel="noopener" className="underline">billetterie officielle</a>. À vérifier sur place.
          </>
        )}
      </p>
    </article>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, TriangleAlert } from "lucide-react";
import { BackLink } from "@/components/BackLink";
import { Badge, CLUSTER_STYLE } from "@/components/SessionCard";
import { SessionActions } from "@/components/SessionActions";
import { CLUSTER_LABEL } from "@/lib/cards";
import { officialLinks, sessionById, sessionLabel, sessions, ticketsFetchedAt, venueById } from "@/lib/data";
import type { Session } from "@/lib/schema";
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
  const primary =
    "flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-green px-4 py-3 text-lg font-extrabold text-on-accent";
  const status = STATUS_LABEL[s.ticketStatus];

  if (s.isFree === true) {
    return (
      <div className="rounded-xl bg-surface p-4 border border-line">
        <div className="flex items-center gap-2">
          <Badge tone="free">Gratuit</Badge>
          <span className="text-sm text-muted">
            Accès libre annoncé par les organisateurs
            {s.freeSource && (
              <>
                {" "}(<a href={s.freeSource} target="_blank" rel="noopener" className="underline">source</a>)
              </>
            )}
          </span>
        </div>
        <a href={mapsHref} target="_blank" rel="noopener" className={`${primary} mt-3`}>
          Comment y aller <ArrowUpRight aria-hidden="true" size={20} />
        </a>
      </div>
    );
  }

  const href = s.ticketUrl ?? officialLinks.ticketing;
  return (
    <div className="rounded-xl bg-surface p-4 border border-line">
      {/* isFree null = gratuité non annoncée : jamais « Payant » par défaut */}
      <p className="mb-2 flex items-center gap-2 text-sm">
        <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-line px-2 py-0.5 text-xs font-bold">Prix : à vérifier</span>
        <span className="text-muted">Tarifs sur la billetterie officielle</span>
      </p>
      {status && (
        <p className={`mb-2 font-bold ${s.ticketStatus === "soldout" || s.ticketStatus === "cancelled" ? "text-red" : "text-green-ink"}`}>
          {status}
          {ticketsFetchedAt && (
            <span className="ml-1 text-xs font-normal text-muted">· relevé le {updatedAt(ticketsFetchedAt)}</span>
          )}
        </p>
      )}
      <a href={href} target="_blank" rel="noopener" className={primary}>
        {s.ticketUrl ? "Acheter sur la billetterie officielle" : "Ouvrir la billetterie officielle"}
        <ArrowUpRight aria-hidden="true" size={20} />
      </a>
      {!s.ticketUrl &&
        (s.ticketMatch === "venue-day" ? (
          <p className="mt-2 text-center text-sm">
            Billet groupé : cherche <strong>{venueById.get(s.venueId)!.name}</strong> le {longDay(dayKey(s.start))}
            {" "}(un billet pour plusieurs sessions du site).
          </p>
        ) : (
          <p className="mt-2 text-center text-sm">
            Cherche le code <strong className="tabular text-base">{s.id}</strong>
          </p>
        ))}
      {s.ticketMatch === "none" && s.kind === "sport" && (
        <p className="mt-1 text-center text-xs text-muted">Session introuvable dans la billetterie (vente close ou pas de billet).</p>
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
  const style = CLUSTER_STYLE[v.cluster];
  const day = dayKey(s.start);
  const mapsHref = mapsUrl(v);
  const place = `${v.name}${s.hall ? ` (${s.hall})` : ""}`;

  return (
    <article className="pt-2">
      <BackLink href="/" />

      <div>
        <p className="tabular mt-1 inline-block rounded-md bg-ink px-2 py-0.5 text-sm font-bold tracking-wider text-sand">{s.id}</p>
      </div>
      <h1 className="mt-2 flex items-center gap-2 text-3xl font-extrabold leading-tight">
        {label} <span aria-hidden="true">{emoji}</span>
      </h1>

      <div className="mt-3 rounded-xl border border-line bg-surface p-4">
        <p className="first-letter:uppercase font-semibold">{longDay(day)}</p>
        <p className="tabular text-2xl font-extrabold">
          {timeRange(s.start, s.end)}
          {s.end === null && <span className="text-base font-semibold text-muted"> · fin non communiquée</span>}
        </p>
        <p className="mt-2">
          <Link href={`/sites/${v.id}`} className="font-bold underline underline-offset-2">{place}</Link>
          <span className={`ml-2 text-sm font-semibold ${style.text}`}>
            <span className={`mr-1 inline-block size-2 rounded-full align-middle ${style.dot}`} aria-hidden="true" />
            {CLUSTER_LABEL[v.cluster]}
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
        <div role="note" className="mt-3 flex gap-2 rounded-xl border border-current p-3 text-sm text-sun-ink">
          <TriangleAlert aria-hidden="true" size={20} className="shrink-0" />
          <p className="text-ink">
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
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-muted">
            Épreuves ({s.events.length})
          </h2>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {s.events.map((e, i) => (
              <li key={i} className="px-4 py-2.5">{e}</li>
            ))}
          </ul>
          <details className="mt-2">
            <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-muted">
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

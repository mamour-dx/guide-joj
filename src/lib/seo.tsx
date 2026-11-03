// Données structurées schema.org (JSON-LD) et métadonnées communes à toutes les pages.
// Rien n'est deviné : un champ inconnu (heure de fin, GPS, prix…) est simplement omis.
import type { Metadata } from "next";
import { CLUSTER_LABEL } from "./cards";
import { officialLinks, sessionLabel } from "./data";
import type { Session, Venue } from "./schema";
import { officialBranding } from "./brand";
import { absoluteUrl, site } from "./site";

export const siteLabel = officialBranding ? site.name : `${site.name} (non officiel)`;

/** Canonical, og:url et bloc openGraph complet d'une page. Le bloc openGraph d'une page
 *  remplace celui du layout : on y remet tout. Les filtres en ?query pointent vers la page nue.
 *  Sans `images`, c'est l'image du dossier (opengraph-image.tsx) qui s'applique. */
export function pageSeo(path: string, images?: OgImage[]): Pick<Metadata, "alternates" | "openGraph"> {
  return {
    alternates: { canonical: path },
    openGraph: { type: "website", locale: "fr_FR", siteName: siteLabel, url: path, ...(images && { images }) },
  };
}

type OgImage = { url: string; width: number; height: number; alt: string };

const GAMES = {
  "@type": "SportsEvent",
  name: "Jeux Olympiques de la Jeunesse Dakar 2026",
  startDate: "2026-10-31",
  endDate: "2026-11-13",
};

function place(v: Venue) {
  return {
    "@type": "SportsActivityLocation",
    name: v.name,
    url: absoluteUrl(`/sites/${v.id}`),
    address: { "@type": "PostalAddress", addressLocality: CLUSTER_LABEL[v.cluster], addressCountry: "SN" },
    ...(v.lat !== null && v.lng !== null && { geo: { "@type": "GeoCoordinates", latitude: v.lat, longitude: v.lng } }),
  };
}

/** Épreuve sans drapeaux emoji : « 🇨🇺 CUB – TUR 🇹🇷 » → « CUB – TUR ». */
const plain = (e: string) => e.replace(/\p{Regional_Indicator}/gu, "").replace(/\s+/g, " ").trim();

const AVAILABILITY: Partial<Record<Session["ticketStatus"], string>> = {
  available: "https://schema.org/InStock",
  limited: "https://schema.org/LimitedAvailability",
  soldout: "https://schema.org/SoldOut",
};

export function sessionJsonLd(s: Session, v: Venue) {
  const url = absoluteUrl(`/session/${s.id}`);
  const availability = AVAILABILITY[s.ticketStatus];
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${sessionLabel(s).label} · ${s.id}`,
    url,
    image: absoluteUrl(`/session/${s.id}/opengraph-image`),
    ...(s.events.length > 0 && { description: s.events.map(plain).join(" · ") }),
    startDate: s.start,
    ...(s.end && { endDate: s.end }),
    eventStatus: s.ticketStatus === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: "fr",
    location: place(v),
    superEvent: GAMES,
    ...(s.isFree === true && { isAccessibleForFree: true }),
    // pas de prix : on ne publie que le statut relevé sur la billetterie officielle
    ...(availability && { offers: { "@type": "Offer", url: s.ticketUrl ?? officialLinks.ticketing, availability } }),
  };
}

export function venueJsonLd(v: Venue) {
  return { "@context": "https://schema.org", ...place(v) };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    alternateName: "Guide des sessions JOJ Dakar 2026",
    url: absoluteUrl("/"),
    inLanguage: "fr",
    description: site.tagline,
  };
}

export function JsonLd({ data }: { data: object | object[] }) {
  // « < » échappé : le JSON ne peut pas fermer la balise script
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

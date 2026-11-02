import type { Metadata } from "next";
import { TodayView } from "@/components/TodayView";
import { buildDay, cardsForDay, days, homeDay, homeOgImage, sportChips } from "@/lib/data";
import { officialBranding } from "@/lib/brand";
import { site } from "@/lib/site";
import { longDay } from "@/lib/time";

const siteLabel = officialBranding ? site.name : `${site.name} (non officiel)`;

const homeCards = homeDay.day ? cardsForDay(homeDay.day) : [];

/** « lundi 2 novembre : 18 sessions (Badminton, Futsal, Natation…) » — figé au build, rebuild quotidien. */
function summary(): { title: string; description: string } {
  if (!homeDay.day) {
    return {
      title: "Les JOJ Dakar 2026 sont terminés",
      description: "Les Jeux Olympiques de la Jeunesse Dakar 2026 se sont déroulés du 30 octobre au 13 novembre 2026.",
    };
  }
  const day = longDay(homeDay.day);
  const sportsList = [...new Set(homeCards.map((c) => c.label))].slice(0, 6).join(", ");
  const when = homeDay.isToday ? `Aujourd'hui, ${day}` : `Prochaine journée : ${day}`;
  return {
    title: `${when} aux JOJ Dakar 2026`,
    description: `${when} : ${homeCards.length} sessions à Dakar, Diamniadio et Saly (${sportsList}…). Horaires, lieux, gratuité et accès.${officialBranding ? "" : " Guide non officiel."}`,
  };
}

const { title, description } = summary();

export const metadata: Metadata = {
  title: { absolute: `${title} — ${siteLabel}` },
  description,
  // l'objet openGraph d'une page remplace celui du layout : on y remet l'image datée
  openGraph: { type: "website", locale: "fr_FR", siteName: siteLabel, title, description, images: [homeOgImage] },
  twitter: { card: "summary_large_image", title, description, images: [homeOgImage.url] },
  other: { "joj:build-day": buildDay },
};

export default function TodayPage() {
  return (
    <>
      <TodayView days={days} sports={sportChips} initial={{ ...homeDay, cards: homeCards }} />
      <noscript>
        <p className="mt-4 border border-line p-4 text-sm">
          Sans JavaScript, la page ne sait pas ce qui est en cours : toutes les sessions du jour sont listées par heure.
        </p>
      </noscript>
    </>
  );
}

// Image de partage de l'accueil, datée : /og/jour-2026-11-08.png. L'URL change chaque jour,
// donc les messageries (WhatsApp…) ne ressortent pas l'aperçu de la veille depuis leur cache.
import { ogImage } from "@/lib/og";
import { site } from "@/lib/site";
import { cardsForDay, days } from "@/lib/data";
import { longDay } from "@/lib/time";

export async function generateStaticParams() {
  return [...days.map((d) => ({ file: `jour-${d}.png` })), { file: "fin.png" }];
}

export async function GET(_req: Request, { params }: RouteContext<"/og/[file]">) {
  const { file } = await params;
  if (file === "fin.png") {
    return ogImage({
      kicker: site.shortName,
      title: "Les JOJ Dakar 2026 sont terminés",
      lines: ["Du 30 octobre au 13 novembre 2026"],
      titleSize: 68,
    });
  }
  const m = /^jour-(\d{4}-\d{2}-\d{2})\.png$/.exec(file);
  if (!m || !days.includes(m[1])) return new Response("Not found", { status: 404 });
  const day = longDay(m[1]);
  return ogImage({
    kicker: "Aux JOJ Dakar 2026",
    title: day.charAt(0).toUpperCase() + day.slice(1),
    lines: [`${cardsForDay(m[1]).length} sessions · Dakar · Diamniadio · Saly`, "Horaires, lieux, gratuité, accès"],
  });
}

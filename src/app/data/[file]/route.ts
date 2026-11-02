// Données découpées par jour pour le client : /data/day-2026-11-09.json (une par jour),
// générées au build. L'accueil ne charge ainsi que le jour affiché.
import { cardsForDay, days } from "@/lib/data";

export async function generateStaticParams() {
  return days.map((d) => ({ file: `day-${d}.json` }));
}

export async function GET(_req: Request, { params }: RouteContext<"/data/[file]">) {
  const { file } = await params;
  const m = /^day-(\d{4}-\d{2}-\d{2})\.json$/.exec(file);
  if (!m || !days.includes(m[1])) return new Response("Not found", { status: 404 });
  return Response.json(cardsForDay(m[1]));
}

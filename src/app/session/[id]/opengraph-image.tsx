import { ogImage, ogSize } from "@/lib/og";
import { sessionById, sessionLabel, sessions, venueById } from "@/lib/data";
import { dayKey, longDay, timeRange } from "@/lib/time";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Session des JOJ Dakar 2026 : sport, code, date, heure et site";

export async function generateStaticParams() {
  return sessions.map((s) => ({ id: s.id }));
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = sessionById.get(id)!;
  const v = venueById.get(s.venueId)!;
  const day = longDay(dayKey(s.start));
  return ogImage({
    kicker: `Session ${s.id}`,
    title: sessionLabel(s).label,
    lines: [
      `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${timeRange(s.start, s.end)}`,
      v.name,
    ],
  });
}

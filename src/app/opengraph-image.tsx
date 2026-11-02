import { ogImage, ogSize } from "@/lib/og";

export const alt = "JOJ Guide — le guide non officiel des JOJ Dakar 2026, du 30 octobre au 13 novembre";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    kicker: "Le guide non officiel",
    title: "Qu'est-ce que je peux voir aux JOJ aujourd'hui ?",
    titleSize: 68,
    lines: ["Dakar · Diamniadio · Saly", "Du 30 octobre au 13 novembre 2026"],
  });
}

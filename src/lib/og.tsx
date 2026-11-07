// Images de partage (next/og) : aplat bleu, nom du site, titre et mention « non officiel ».
import { ImageResponse } from "next/og";
import { site } from "./site";

export const ogSize = { width: 1200, height: 630 };

export function ogImage({ kicker, title, lines, titleSize = 88 }: { kicker: string; title: string; lines: string[]; titleSize?: number }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0078D0", color: "#FFFFFF" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "56px 64px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 40, fontWeight: 800 }}>{site.name}</div>
            <div style={{ fontSize: 30, fontWeight: 700, marginTop: 44, textTransform: "uppercase", letterSpacing: 2 }}>{kicker}</div>
            <div style={{ fontSize: titleSize, fontWeight: 800, lineHeight: 1.02, marginTop: 10 }}>{title}</div>
            {lines.map((l, i) => (
              <div key={i} style={{ fontSize: 34, marginTop: i === 0 ? 22 : 6, opacity: i === 0 ? 1 : 0.85 }}>{l}</div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>
            Site non officiel
          </div>
        </div>
      </div>
    ),
    ogSize,
  );
}

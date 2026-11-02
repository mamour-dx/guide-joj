// Images de partage (next/og) : texte + date, bande tricolore, aucun logo ni emblème.
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

export function ogImage({ kicker, title, lines, titleSize = 88 }: { kicker: string; title: string; lines: string[]; titleSize?: number }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FBF7EF", color: "#14161A" }}>
        <div style={{ display: "flex", height: 18 }}>
          <div style={{ flex: 1, background: "#00853F" }} />
          <div style={{ flex: 1, background: "#FDEF42" }} />
          <div style={{ flex: 1, background: "#E31B23" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "60px 72px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: "#006B33" }}>{kicker}</div>
            <div style={{ fontSize: titleSize, fontWeight: 800, lineHeight: 1.05, marginTop: 18 }}>{title}</div>
            {lines.map((l, i) => (
              <div key={i} style={{ fontSize: 40, marginTop: i === 0 ? 28 : 8, color: i === 0 ? "#14161A" : "#5B616B" }}>{l}</div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#5B616B" }}>
            <div>JOJ Guide · JOJ Dakar 2026</div>
            <div style={{ fontWeight: 700 }}>Site non officiel</div>
          </div>
        </div>
      </div>
    ),
    ogSize,
  );
}

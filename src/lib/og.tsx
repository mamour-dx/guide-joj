// Images de partage (next/og) : aplat bleu Dakar 2026, emblème officiel tel que fourni et motif
// du « look des Jeux ». Avec officialBranding = false : même mise en page, sans emblème ni motif.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { officialBranding } from "./brand";
import { site } from "./site";

export const ogSize = { width: 1200, height: 630 };

const asset = (file: string, type: string) =>
  `data:${type};base64,${readFileSync(join(process.cwd(), "public/brand", file)).toString("base64")}`;

export function ogImage({ kicker, title, lines, titleSize = 88 }: { kicker: string; title: string; lines: string[]; titleSize?: number }) {
  const emblem = officialBranding ? asset("emblem-horizontal-blue.png", "image/png") : null;
  const pattern = officialBranding ? asset("pattern.jpg", "image/jpeg") : null;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0078D0", color: "#FFFFFF" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "56px 64px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {emblem ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={emblem} width={320} height={110} alt="" />
            ) : (
              <div style={{ fontSize: 40, fontWeight: 800 }}>{site.name}</div>
            )}
            <div style={{ fontSize: 30, fontWeight: 700, marginTop: 44, textTransform: "uppercase", letterSpacing: 2 }}>{kicker}</div>
            <div style={{ fontSize: titleSize, fontWeight: 800, lineHeight: 1.02, marginTop: 10 }}>{title}</div>
            {lines.map((l, i) => (
              <div key={i} style={{ fontSize: 34, marginTop: i === 0 ? 22 : 6, opacity: i === 0 ? 1 : 0.85 }}>{l}</div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>
            {officialBranding ? site.slogan : "Site non officiel"}
          </div>
        </div>
        {pattern && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pattern} width={300} height={630} alt="" style={{ objectFit: "cover" }} />
        )}
      </div>
    ),
    ogSize,
  );
}

/* eslint-disable @next/next/no-img-element -- petites images statiques à taille fixe, pas besoin de next/image */
// Marques officielles (mascotte, pictogrammes), toutes au même endroit. Avec officialBranding = false,
// chaque composant retombe sur un équivalent sans marque. Les fichiers sont utilisés tels que
// fournis : jamais redessinés, recolorés ni recadrés (charte olympique).
import { PartyPopper } from "lucide-react";
import { officialBranding, pictoUrl } from "@/lib/brand";

/** Ayo, la mascotte. Fond blanc d'origine : toujours posée sur blanc. */
export function Mascot({ height = 160 }: { height?: number }) {
  if (!officialBranding) return null;
  return (
    <img
      src="/brand/ayo.jpg"
      alt="Ayo, la mascotte des JOJ Dakar 2026"
      width={Math.round((height * 380) / 526)}
      height={height}
      loading="lazy"
      className="bg-white"
      style={{ height, width: "auto" }}
    />
  );
}

/** Pictogramme officiel du sport (cadre carré inclus), ou repli emoji / icône. */
export function SportPicto({ sportId, emoji, size = 48 }: { sportId: string | null; emoji: string; size?: number }) {
  const url = pictoUrl(sportId);
  if (url) {
    return (
      <img src={url} alt="" width={size} height={size} loading="lazy" className="block shrink-0 bg-white" style={{ width: size, height: size }} />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center border-2 border-ink bg-white text-black"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {sportId ? emoji : <PartyPopper size={size * 0.55} strokeWidth={2.25} />}
    </span>
  );
}

/* eslint-disable @next/next/no-img-element -- petites images statiques à taille fixe, pas besoin de next/image */
// Marques officielles, toutes au même endroit. Avec officialBranding = false, chaque composant
// retombe sur un équivalent sans marque. L'emblème est utilisé tel que fourni : jamais redessiné,
// recoloré ni recadré (charte : « must not be altered, modified or reproduced »).
import { PartyPopper } from "lucide-react";
import { officialBranding, pictoUrl } from "@/lib/brand";

/** Emblème vertical en couleurs, sur fond blanc uniquement (charte des anneaux). */
export function VerticalEmblem({ height = 96 }: { height?: number }) {
  if (!officialBranding) return null;
  return (
    <span className="inline-block bg-white p-2">
      <img
        src="/brand/emblem-vertical.png"
        alt="Dakar 2026 — Jeux Olympiques de la Jeunesse"
        width={Math.round((height * 279) / 385)}
        height={height}
        loading="lazy"
        style={{ height, width: "auto" }}
      />
    </span>
  );
}

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

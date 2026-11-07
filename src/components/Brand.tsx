// Icône de sport : l'emoji du sport dans un carré bordé (aucun pictogramme officiel).
import { PartyPopper } from "lucide-react";

export function SportPicto({ sportId, emoji, size = 48 }: { sportId: string | null; emoji: string; size?: number }) {
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

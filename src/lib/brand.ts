// Marques officielles Dakar 2026 (emblème, pictogrammes, mascotte Ayo), tirées du guide médias
// du COJOJ (oct. 2026) et rangées dans public/brand/. Sans dépendance : importable côté client.

/** true uniquement tant que le COJOJ autorise le site à porter ses marques.
 *  false = repli complet sans aucune marque (emoji à la place des pictogrammes, mention « non officiel »). */
export const officialBranding = true;

/** Pictogrammes officiels disponibles (public/brand/pictos/<id>.webp), par id de data/sports.json. */
const PICTOS = new Set([
  "archery", "artistic-gymnastics", "athletics", "badminton", "baseball5", "basketball-3x3",
  "beach-handball", "beach-volleyball", "beach-wrestling", "boxing", "breaking", "cycling-road",
  "equestrian", "fencing", "futsal", "judo", "rowing-beach", "rugby-sevens", "sailing",
  "skateboarding", "swimming", "table-tennis", "taekwondo", "triathlon", "wushu",
]);

export function pictoUrl(sportId: string | null): string | null {
  return officialBranding && sportId && PICTOS.has(sportId) ? `/brand/pictos/${sportId}.webp` : null;
}

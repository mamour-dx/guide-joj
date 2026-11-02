// Règle CSS qui masque les cartes du programme ne correspondant pas aux filtres de l'URL.
// Fonction AUTONOME (aucun import, aucune référence extérieure) : son code source est aussi
// injecté tel quel dans un <script> exécuté avant le premier affichage (programme/page.tsx),
// pour que la page ne « saute » pas à l'hydratation. Ne pas y ajouter de dépendance.
export function programmeCss(search: string, days: string[], today: string | null): string {
  const p = new URLSearchParams(search);
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const list = (k: string) => (p.get(k) || "").split(",").map((x) => x.replace(/[^a-z0-9-]/g, "")).filter(Boolean);
  const terms = norm(p.get("q") || "").split(/\s+/).map((t) => t.replace(/[^a-z0-9+\-./]/g, "")).filter(Boolean);
  let day = p.get("jour");
  if (!day || days.indexOf(day) < 0) {
    if (today === null) day = null;
    else day = days.indexOf(today) >= 0 ? today : days.filter((d) => d > today)[0] || days[days.length - 1];
  }
  let sel = "[data-card]";
  if (day && !terms.length) sel += '[data-day="' + day + '"]';
  if (p.get("gratuit") === "1") sel += "[data-free]";
  if (p.get("finale") === "1") sel += "[data-final]";
  const clusters = list("secteur");
  if (clusters.length) sel += ":is(" + clusters.map((c) => '[data-cluster="' + c + '"]').join(",") + ")";
  const sports = list("sport");
  if (sports.length) sel += ":is(" + sports.map((s) => '[data-sport="' + s + '"]').join(",") + ")";
  for (const t of terms) sel += '[data-search*="' + t + '"]';
  return (
    "#prog [data-card]:not(" + sel + "){display:none}" +
    "#prog [data-group]:not(:has(" + sel + ")){display:none}" +
    "#prog .prog-empty{display:block}#prog:has(" + sel + ") .prog-empty{display:none}"
  );
}

/** Jour à Dakar, « 2026-11-09 ». Autonome, comme programmeCss. */
export function dakarToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Dakar", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

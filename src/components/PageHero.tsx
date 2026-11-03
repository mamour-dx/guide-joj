// En-tête de page : aplat pleine largeur aux couleurs olympiques, sur-titre mono et grand titre
// condensé terminé par un point. Le texte reste noir sur la couleur (contrastes AA).
export type HeroTone = "green" | "yellow" | "red" | "black";

export function PageHero({ tone, eyebrow, title, children }: { tone: HeroTone; eyebrow?: React.ReactNode; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className={`bleed bleed-${tone} pt-7 pb-6`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="display mt-2 text-6xl sm:text-7xl">{title}</h1>
      {children}
    </section>
  );
}

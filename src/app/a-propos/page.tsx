import type { Metadata } from "next";
import { meta, sourceList, homeOgImage } from "@/lib/data";
import { PageHero } from "@/components/PageHero";
import { site } from "@/lib/site";
import { updatedAt } from "@/lib/time";
import { pageSeo } from "@/lib/seo";

export const metadata: Metadata = {
  title: "À propos",
  description: `Ce qu'est ${site.name} et d'où viennent ses données.`,
  ...pageSeo("/a-propos", [homeOgImage]),
};

export default function AboutPage() {
  return (
    <article>
      <PageHero tone="black" eyebrow="C'est qui, c'est quoi ?" title="À propos.">
        <p className="mt-4 border-l-4 border-o-yellow pl-3 font-medium">{site.disclaimer}</p>
      </PageHero>


      <section className="mt-8 space-y-3">
        <h2 className="display border-b-2 border-line pb-2 text-4xl">C&apos;est quoi ?</h2>
        <p>
          {site.tagline}. Une seule page pour savoir ce que tu peux voir aujourd&apos;hui, où, à quelle heure, si
          c&apos;est gratuit et comment y aller. Les billets s&apos;achètent uniquement sur la billetterie officielle :
          ici, il n&apos;y a ni paiement, ni compte, ni cookie de suivi.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="display border-b-2 border-line pb-2 text-4xl">D&apos;où viennent les données ?</h2>
        <p>
          Le programme vient du PDF officiel publié le 30/10/2026. Les liens et statuts de billetterie, ainsi que les
          événements Fan, viennent de la billetterie officielle. Quand la billetterie annonce un autre horaire que le
          PDF, on affiche celui de la billetterie, avec une mention. Une info inconnue est marquée « à vérifier », jamais
          devinée.
        </p>
        <ul className="card divide-y-2 divide-dotted divide-line-soft overflow-hidden">
          {sourceList.map((s) => (
            <li key={s.id} className="px-4 py-3">
              <span className="tabular mr-2 font-mono text-xs text-muted">{s.id}</span>
              <a href={s.url} target="_blank" rel="noopener" className="font-semibold underline underline-offset-2">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="eyebrow text-muted">Données mises à jour le {updatedAt(meta.generatedAt)} (heure de Dakar).</p>
      </section>

      {site.repoUrl && (
        <section className="mt-8 space-y-3">
          <h2 className="display border-b-2 border-line pb-2 text-4xl">Open source.</h2>
          <p>
            Le code du site est public : tu peux le lire, le réutiliser pour ton propre projet ou proposer une
            amélioration.{" "}
            <a href={site.repoUrl} target="_blank" rel="noopener" className="font-semibold underline">
              Voir le code sur GitHub
            </a>
          </p>
        </section>
      )}

      {(site.contact || site.channelUrl) && (
        <section className="mt-8 space-y-3">
          <h2 className="display border-b-2 border-line pb-2 text-4xl">Contact.</h2>
          {site.contact && (
            <p>
              Une erreur, une info à corriger ?{" "}
              <a href={`mailto:${site.contact}`} className="font-semibold underline">{site.contact}</a>
            </p>
          )}
          {site.channelUrl && (
            <p>
              Fait par{" "}
              <a href={site.channelUrl} target="_blank" rel="noopener" className="font-semibold underline">MXR CODES</a>.
            </p>
          )}
        </section>
      )}
    </article>
  );
}

import type { Metadata } from "next";
import { meta, sourceList } from "@/lib/data";
import { site } from "@/lib/site";
import { updatedAt } from "@/lib/time";

export const metadata: Metadata = {
  title: "À propos",
  description: "Ce qu'est JOJ Guide, d'où viennent les données, et la mention « site non officiel ».",
};

export default function AboutPage() {
  return (
    <article className="pt-2">
      <h1 className="text-2xl font-extrabold">À propos</h1>

      <div className="mt-3 rounded-xl border-2 border-red bg-surface p-4 font-semibold">{site.disclaimer}</div>

      <section className="mt-5 space-y-2">
        <h2 className="text-lg font-extrabold">C&apos;est quoi ?</h2>
        <p>
          {site.tagline}. Une seule page pour savoir ce que tu peux voir aujourd&apos;hui, où, à quelle heure, si
          c&apos;est gratuit et comment y aller. Les billets s&apos;achètent uniquement sur la billetterie officielle :
          ici, il n&apos;y a ni paiement, ni compte, ni cookie de suivi.
        </p>
      </section>

      <section className="mt-5 space-y-2">
        <h2 className="text-lg font-extrabold">D&apos;où viennent les données ?</h2>
        <p>
          Le programme vient du PDF officiel publié le 30/10/2026. Les liens et statuts de billetterie, ainsi que les
          événements Fan, viennent de la billetterie officielle. Quand la billetterie annonce un autre horaire que le
          PDF, on affiche celui de la billetterie, avec une mention. Une info inconnue est marquée « à vérifier », jamais
          devinée.
        </p>
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {sourceList.map((s) => (
            <li key={s.id} className="px-4 py-3">
              <span className="tabular mr-2 text-xs font-bold text-muted">{s.id}</span>
              <a href={s.url} target="_blank" rel="noopener" className="font-semibold underline underline-offset-2">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">Données mises à jour le {updatedAt(meta.generatedAt)} (heure de Dakar).</p>
      </section>

      {(site.contact || site.channelUrl) && (
        <section className="mt-5 space-y-2">
          <h2 className="text-lg font-extrabold">Contact</h2>
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

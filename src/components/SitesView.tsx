"use client";

// Bascule Liste / Carte de la page Sites. La liste (rendue côté serveur) reste l'affichage par
// défaut et fonctionne sans JS ; la carte n'est téléchargée qu'au premier passage sur « Carte ».
import dynamic from "next/dynamic";
import { useState, useSyncExternalStore } from "react";
import { List, Map as MapIcon } from "lucide-react";
import type { MapVenue } from "./SitesMap";

const SitesMap = dynamic(() => import("./SitesMap"), {
  ssr: false,
  loading: () => <div className="skeleton mt-[3.75rem] h-[62dvh] min-h-80" aria-label="Chargement de la carte" />,
});

type View = "liste" | "carte";

const noop = () => () => {};

export function SitesView({ venues, unplaced, children }: { venues: MapVenue[]; unplaced: number; children: React.ReactNode }) {
  const [chosen, setView] = useState<View | null>(null);
  // #carte : on revient sur la carte après « retour » depuis une fiche site, et le lien se partage
  const fromHash = useSyncExternalStore(noop, () => location.hash === "#carte", () => false);
  const view: View = chosen ?? (fromHash ? "carte" : "liste");

  function choose(v: View) {
    setView(v);
    history.replaceState(null, "", v === "carte" ? "#carte" : location.pathname);
  }

  const tabs: { id: View; label: string; Icon: typeof List }[] = [
    { id: "liste", label: "Liste", Icon: List },
    { id: "carte", label: "Carte", Icon: MapIcon },
  ];

  return (
    <>
      <div role="group" aria-label="Affichage" className="mt-4 grid grid-cols-2 border-2 border-line bg-surface">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            onClick={() => choose(id)}
            className={`inline-flex min-h-11 items-center justify-center gap-2 text-sm font-medium transition-colors duration-200 ${
              view === id ? "bg-ink text-page" : "text-ink hover:bg-tint"
            }`}
          >
            <Icon aria-hidden="true" size={18} />
            {label}
          </button>
        ))}
      </div>

      {view === "carte" ? (
        <section className="mt-2">
          <SitesMap venues={venues} />
          {unplaced > 0 && (
            <p className="mt-2 text-sm text-muted">
              {unplaced} site{unplaced > 1 ? "s" : ""} pas encore placé{unplaced > 1 ? "s" : ""} sur la carte (position à vérifier) :{" "}
              <button type="button" onClick={() => choose("liste")} className="font-semibold text-ink underline underline-offset-2">
                voir la liste
              </button>
              .
            </p>
          )}
        </section>
      ) : (
        children
      )}
    </>
  );
}

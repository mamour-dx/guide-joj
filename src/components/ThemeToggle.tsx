"use client";

// Bouton clair / sombre. Le clair est le thème par défaut ; le choix est gardé dans
// localStorage (préférence locale, pas un cookie). THEME_SCRIPT l'applique avant l'affichage.
import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

export const THEME_SCRIPT = `try{if(localStorage.getItem("theme")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

// L'état vit dans l'attribut data-theme de <html> : on l'observe au lieu de le recopier.
function subscribe(onChange: () => void) {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}
const isDark = () => document.documentElement.dataset.theme === "dark";

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  function flip() {
    if (dark) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = "dark";
    try {
      localStorage.setItem("theme", dark ? "light" : "dark");
    } catch {
      // stockage indisponible (navigation privée) : le choix vaut pour cette page seulement
    }
  }

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={dark ? "Passer en thème clair" : "Passer en thème sombre"}
      aria-pressed={dark}
      className="flex size-11 shrink-0 items-center justify-center border border-white/40 text-on-blue"
    >
      {dark ? <Sun aria-hidden="true" size={20} /> : <Moon aria-hidden="true" size={20} />}
    </button>
  );
}

"use client";

// Effet de clic / toucher : quatre carrés jaune, noir, vert, rouge jaillissent du point touché
// (styles .burst dans globals.css). Purement décoratif, rien n'est rendu par React ; désactivé
// si l'utilisateur demande moins d'animations.
import { useEffect } from "react";

const COLORS = ["var(--o-yellow)", "var(--ink)", "var(--o-green)", "var(--o-red)"];

export function ClickBurst() {
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");

    function onDown(e: PointerEvent) {
      if (reduce.matches || e.button !== 0) return;
      const burst = document.createElement("span");
      burst.className = "burst";
      burst.setAttribute("aria-hidden", "true");
      burst.style.left = `${e.clientX}px`;
      burst.style.top = `${e.clientY}px`;
      burst.appendChild(document.createElement("b"));
      // angle de départ au hasard : chaque clic est un peu différent
      const start = Math.random() * Math.PI * 2;
      COLORS.forEach((c, i) => {
        const a = start + (i * Math.PI) / 2;
        const d = 26 + Math.random() * 14;
        const sq = document.createElement("i");
        sq.style.setProperty("--c", c);
        sq.style.setProperty("--x", `${Math.cos(a) * d}px`);
        sq.style.setProperty("--y", `${Math.sin(a) * d}px`);
        sq.style.setProperty("--r", `${(i % 2 ? -1 : 1) * 180}deg`);
        burst.appendChild(sq);
      });
      document.body.appendChild(burst);
      setTimeout(() => burst.remove(), 700);
    }

    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  return null;
}

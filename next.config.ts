import type { NextConfig } from "next";

// Jour du build à Dakar (UTC+0). Calculé ici, une fois, au lancement du build : lire l'heure
// pendant le prérendu est interdit avec cacheComponents. L'accueil pré-rend les sessions de
// ce jour ; la GitHub Action relance un build chaque matin (Deploy Hook) pour le tenir à jour.
// JOJ_BUILD_DAY=2026-11-08 permet de simuler un autre jour en local.
const buildDay =
  process.env.JOJ_BUILD_DAY ??
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Dakar", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

const nextConfig: NextConfig = {
  env: { JOJ_BUILD_DAY: buildDay },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // un package-lock.json traîne dans le dossier personnel : on fixe la racine du projet
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

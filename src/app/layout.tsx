import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { ClickBurst } from "@/components/ClickBurst";
import { LiveBanner } from "@/components/LiveBanner";
import { THEME_SCRIPT, ThemeToggle } from "@/components/ThemeToggle";
import { officialBranding } from "@/lib/brand";
import { homeOgImage, meta, officialLinks } from "@/lib/data";
import { siteLabel as label } from "@/lib/seo";
import { indexable, site, siteUrl } from "@/lib/site";
import { updatedAt } from "@/lib/time";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const shoulders = Big_Shoulders({ variable: "--font-shoulders", weight: "800", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: site.name,
  openGraph: { type: "website", locale: "fr_FR", siteName: label, images: [homeOgImage] },
  // pas de twitter:image : X reprend og:image, qui est propre à chaque page
  twitter: { card: "summary_large_image" },
  robots: indexable ? undefined : { index: false, follow: false },
  formatDetection: { telephone: false },
  title: { default: officialBranding ? site.name : `${site.name} — JOJ Dakar 2026 (non officiel)`, template: `%s · ${site.name}` },
  description: `Qu'est-ce que je peux voir aux JOJ Dakar 2026 aujourd'hui, où, à quelle heure, et comment y aller ? ${site.tagline}.`,
};

export const viewport: Viewport = {
  // fond blanc cassé de l'en-tête (thème clair par défaut)
  themeColor: "#F6F6F3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geist.variable} ${geistMono.variable} ${shoulders.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* thème sombre choisi : appliqué avant l'affichage (clair par défaut) */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh flex flex-col">
        {/* cadre aux quatre couleurs olympiques tout autour de l'écran (voir .frame) */}
        <div aria-hidden="true" className="frame" />
        <header className="border-b-2 border-line">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" aria-label={`${site.name} — accueil`} className="flex min-w-0 items-center">
              <span className="leading-none">
                <span className="display block whitespace-nowrap text-[1.75rem]">{officialBranding ? "Dakar 2026" : "JOJ Guide"}</span>
                <span className="eyebrow block whitespace-nowrap text-xs text-muted">{officialBranding ? "Guide des sessions" : "Non officiel"}</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <a href={officialLinks.ticketingHome} target="_blank" rel="noopener" className="btn min-h-11 px-3 text-sm">
                {/* « Billets » sur les petits écrans : le nom du site garde sa place */}
                <span className="hidden min-[400px]:inline">Billetterie</span>
                <span className="min-[400px]:hidden">Billets</span>
                <ArrowUpRight aria-hidden="true" size={16} className="nudge" />
              </a>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <LiveBanner />

        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-8">{children}</main>

        {/* pied de page sobre : le nom en très grand (chiffres de 2026 aux couleurs olympiques),
            puis une seule ligne d'infos et deux liens */}
        <footer className="bleed bleed-black pb-24">
          <div className="mx-auto w-full max-w-2xl px-4 pt-10 @container">
            <p className="display flex justify-between whitespace-nowrap leading-[0.8]" style={{ fontSize: "21.5cqw" }} aria-label="Dakar 2026">
              <span>Dakar</span>
              <span aria-hidden="true">
                <span className="text-o-yellow">2</span>
                <span>0</span>
                <span className="text-o-green">2</span>
                <span className="text-o-red">6</span>
              </span>
            </p>
            <div className="eyebrow mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-t-2 border-[#F6F6F3] pt-3 text-xs text-[#B4B4AA]">
              <p>
                {site.disclaimer}
                <br />
                Mis à jour le {updatedAt(meta.generatedAt)} (heure de Dakar).
              </p>
              <p className="flex gap-4 text-[#F6F6F3]">
                <a href={officialLinks.ticketingHome} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1 underline underline-offset-4">
                  Billetterie <ArrowUpRight aria-hidden="true" size={14} />
                </a>
                <Link href="/a-propos" className="inline-flex min-h-11 items-center underline underline-offset-4">
                  À propos
                </Link>
              </p>
            </div>
          </div>
        </footer>
        <BottomNav />
        <ClickBurst />
      </body>
    </html>
  );
}

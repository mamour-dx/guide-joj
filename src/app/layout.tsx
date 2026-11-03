import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { HeaderEmblem, VerticalEmblem } from "@/components/Brand";
import { THEME_SCRIPT, ThemeToggle } from "@/components/ThemeToggle";
import { officialBranding } from "@/lib/brand";
import { homeOgImage, meta, officialLinks, ticketsFetchedAt } from "@/lib/data";
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
        <header className="border-b-2 border-line">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" aria-label={`${site.name} — accueil`} className="-my-1 py-1">
              <HeaderEmblem />
            </Link>
            <div className="flex items-center gap-3">
              {officialBranding && (
                <p className="eyebrow text-right leading-tight">
                  Guide
                  <br />
                  des sessions
                </p>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-8">{children}</main>

        <footer className="bleed bleed-black pb-24">
          <div className="mx-auto w-full max-w-2xl px-4 pt-10">
            <p className="display text-6xl">{site.slogan}</p>
            <div className="mt-6 flex gap-4">
              <div className="shrink-0">
                <VerticalEmblem height={84} />
              </div>
              <div className="eyebrow min-w-0 text-[#B4B4AA]">
                <p>{site.disclaimer}</p>
                <p className="mt-2">
                  Programme mis à jour le {updatedAt(meta.generatedAt)}
                  {ticketsFetchedAt && <> · Statuts billetterie relevés le {updatedAt(ticketsFetchedAt)}</>} (heure de Dakar).
                </p>
              </div>
            </div>
            <p className="mt-6 flex flex-wrap gap-2">
              <a href={officialLinks.ticketingHome} target="_blank" rel="noopener" className="btn bg-[#F6F6F3] text-black">
                Billetterie officielle <ArrowUpRight aria-hidden="true" size={18} className="nudge" />
              </a>
              <Link href="/a-propos" className="btn btn-ghost border-[#F6F6F3] text-[#F6F6F3]">
                Sources et à propos
              </Link>
            </p>
          </div>
        </footer>
        <BottomNav />
      </body>
    </html>
  );
}

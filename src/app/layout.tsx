import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
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

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const bebas = Bebas_Neue({ variable: "--font-bebas", weight: "400", subsets: ["latin"], display: "swap" });

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
  // la barre d'en-tête est bleue dans les deux thèmes
  themeColor: "#0078D0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} ${bebas.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* thème sombre choisi : appliqué avant l'affichage (clair par défaut) */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh flex flex-col">
        <header className="on-blue header-bg text-on-blue">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" aria-label={`${site.name} — accueil`} className="-my-1 py-1">
              <HeaderEmblem />
            </Link>
            <div className="flex items-center gap-3">
              {officialBranding && (
                <p className="display text-right text-[1.375rem]">
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

        <footer className="border-t border-line pb-24">
          <div className="mx-auto flex w-full max-w-2xl gap-4 px-4 pt-5">
            <div className="shrink-0">
              <VerticalEmblem height={84} />
            </div>
            <div className="min-w-0 text-sm text-muted">
              <p className="display text-2xl text-heading">{site.slogan}</p>
              <p className="mt-2">{site.disclaimer}</p>
              <p className="mt-2">
                Programme mis à jour le {updatedAt(meta.generatedAt)}
                {ticketsFetchedAt && <> · Statuts billetterie relevés le {updatedAt(ticketsFetchedAt)}</>} (heure de Dakar).
              </p>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-semibold text-blue-ink">
                <a href={officialLinks.ticketingHome} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-0.5 underline underline-offset-2">
                  Billetterie officielle <ArrowUpRight aria-hidden="true" size={16} />
                </a>
                <Link href="/a-propos" className="inline-flex min-h-11 items-center underline underline-offset-2">
                  Sources et à propos
                </Link>
              </p>
            </div>
          </div>
        </footer>
        <BottomNav />
      </body>
    </html>
  );
}

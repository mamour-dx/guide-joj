import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { homeOgImage, meta } from "@/lib/data";
import { site, siteUrl } from "@/lib/site";
import { updatedAt } from "@/lib/time";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: site.name,
  openGraph: { type: "website", locale: "fr_FR", siteName: `${site.name} (non officiel)`, images: [homeOgImage] },
  twitter: { card: "summary_large_image", images: [homeOgImage.url] },
  title: { default: `${site.name} — JOJ Dakar 2026 (non officiel)`, template: `%s · ${site.name}` },
  description:
    "Qu'est-ce que je peux voir aux JOJ Dakar 2026 aujourd'hui, où, à quelle heure, et comment y aller ? Guide non officiel.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF7EF" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1113" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} antialiased`}>
      <body className="min-h-dvh flex flex-col">
        <div className="stripe" aria-hidden="true" />
        <header className="mx-auto w-full max-w-2xl px-4 pt-3 pb-1 flex items-baseline justify-between gap-2">
          <Link href="/" className="font-extrabold text-lg tracking-tight">
            {site.name} <span className="text-muted font-medium text-sm">· JOJ Dakar 2026</span>
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">non officiel</span>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-6">{children}</main>
        <footer className="mx-auto w-full max-w-2xl px-4 pb-24 pt-4 text-sm text-muted border-t border-line">
          <p>{site.disclaimer}</p>
          <p className="mt-2">
            Données mises à jour le {updatedAt(meta.generatedAt)} (heure de Dakar) ·{" "}
            <Link href="/a-propos" className="underline underline-offset-2">Sources et à propos</Link>
          </p>
        </footer>
        <BottomNav />
      </body>
    </html>
  );
}

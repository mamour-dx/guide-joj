"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, MapPin, Sun } from "lucide-react";

const TABS = [
  { href: "/", label: "Aujourd'hui", Icon: Sun, match: (p: string) => p === "/" || p.startsWith("/session") },
  { href: "/programme", label: "Programme", Icon: CalendarDays, match: (p: string) => p.startsWith("/programme") },
  { href: "/sites", label: "Sites", Icon: MapPin, match: (p: string) => p.startsWith("/sites") },
] as const;

export function BottomNav() {
  const path = usePathname() ?? "/";
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-3">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match(path);
          return (
            <li key={href}>
              <Link
                href={href}
                // pages statiques : pas besoin de précharger leur JS sur l'accueil (budget < 150 Ko)
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-sm font-semibold ${
                  active ? "text-green-ink" : "text-muted"
                }`}
              >
                <Icon aria-hidden="true" size={22} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

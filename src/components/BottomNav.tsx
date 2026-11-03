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
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line-soft bg-surface/90 shadow-[0_-4px_16px_rgb(16_32_56/0.06)] backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
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
                className={`group flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors duration-200 ${
                  active ? "text-blue-ink" : "text-muted"
                }`}
              >
                <span
                  className={`flex h-8 w-16 items-center justify-center rounded-full transition-all duration-300 [transition-timing-function:var(--ease)] group-active:scale-90 ${
                    active ? "bg-blue text-on-blue" : "group-hover:bg-line-soft"
                  }`}
                >
                  <Icon aria-hidden="true" size={20} strokeWidth={active ? 2.5 : 2} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

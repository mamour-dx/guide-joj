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
      className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-line bg-page pb-[calc(env(safe-area-inset-bottom)+var(--frame))]"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-3 gap-2 px-2 py-2">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match(path);
          return (
            <li key={href}>
              <Link
                href={href}
                // pages statiques : pas besoin de précharger leur JS sur l'accueil (budget < 150 Ko)
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={`group flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors duration-200 active:translate-y-px ${
                  active ? "bg-ink text-page" : "text-ink hover:bg-tint"
                }`}
              >
                <Icon aria-hidden="true" size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="font-mono">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/** « Retour » : revient à la page précédente du site si elle existe, sinon suit `href`. */
export function BackLink({ href, label = "Retour" }: { href: string; label?: string }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={(e) => {
        const ref = document.referrer;
        if (ref && new URL(ref).origin === location.origin && history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
      className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted"
    >
      <ChevronLeft aria-hidden="true" size={18} /> {label}
    </Link>
  );
}

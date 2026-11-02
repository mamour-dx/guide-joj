"use client";

import { useSyncExternalStore } from "react";

const STEP = 30_000;

function subscribe(cb: () => void) {
  const id = setInterval(cb, STEP);
  const onVisible = () => document.visibilityState === "visible" && cb();
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    clearInterval(id);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

/** Instant présent (ms), arrondi à 30 s pour rester stable entre deux rendus.
 *  null au prérendu et à l'hydratation : « maintenant » n'existe que dans le navigateur. */
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / STEP) * STEP,
    () => null,
  );
}

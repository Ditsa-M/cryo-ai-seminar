import { useSyncExternalStore } from "react";

// Reduced motion = OS preference OR the in-deck toggle (key "M") OR ?reduced-motion in the URL.
const listeners = new Set<() => void>();
let forced = typeof window !== "undefined" && /reduced-motion/.test(window.location.search);
const mq = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
mq?.addEventListener("change", () => listeners.forEach((l) => l()));

export function isReduced() { return forced || !!mq?.matches; }
export function toggleReduced() {
  forced = !forced;
  document.documentElement.classList.toggle("reduced-motion", isReduced());
  listeners.forEach((l) => l());
}
export function useReducedMotion() {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, isReduced, () => false);
}

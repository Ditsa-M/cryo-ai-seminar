import { useEffect, useState, useSyncExternalStore } from "react";
import { useReveal } from "@revealjs/react";
import { useStep, isPrint } from "../lib/useStep";
import { useReducedMotion } from "../lib/reducedMotion";
import { HAND, HAND_ROUNDS } from "../data/hand";

// Presenter's pointing hand: glides to the target(s) for the current click state (src/data/hand.ts),
// taps, and loops through them every DWELL ms (or for HAND_ROUNDS rounds, then rests on the first).
// Hidden in the PDF; X toggles it during the talk; reduced motion keeps it still on the first target.
const DWELL = 2800, TIP_X = 19;   // fingertip x inside the 64×92 hand drawing (tip at y = 0)

let hidden = typeof window !== "undefined" && /no-hand/.test(window.location.search);
const subs = new Set<() => void>();
export function toggleHand() { hidden = !hidden; subs.forEach((f) => f()); }
const useHidden = () => useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => hidden, () => false);

function resolve(section: Element, spec: string) {
  const [sel, at] = spec.split("@");
  const [fx, fy] = at ? at.split(",").map(Number) : [0.5, 1];
  const css = sel.startsWith("$") ? sel.slice(1) : `[data-hand~="${sel}"]`;
  return [...section.querySelectorAll(css)].filter((el) => !el.closest(".hand")).map((el) => ({ el, fx, fy }));
}

export function Hand({ id, steps }: { id: string; steps: number }) {
  const { ref, step, active } = useStep<HTMLDivElement>(steps);
  const deck = useReveal();
  const still = useReducedMotion(), off = useHidden();
  const specs = HAND[id]?.[step + 1] ?? [];
  const [i, setI] = useState(0);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [n, setN] = useState(1);   // number of targets in the current state
  const rounds = HAND_ROUNDS[id], done = !!rounds && i >= rounds * n;

  useEffect(() => setI(0), [step, active]);
  useEffect(() => {
    if (!active || still || off || done) return;
    const t = setInterval(() => setI((k) => k + 1), DWELL);
    return () => clearInterval(t);
  }, [active, still, off, step, done]);
  useEffect(() => {
    const section = ref.current?.closest("section");
    if (!section || !active || !specs.length) { setPos(null); return; }
    const measure = () => {
      const targets = specs.flatMap((s) => resolve(section, s));
      if (!targets.length) { setPos(null); return; }
      setN(targets.length);
      const { el, fx, fy } = targets[done ? 0 : i % targets.length];
      const sb = section.getBoundingClientRect(), r = el.getBoundingClientRect();
      const scale = sb.width / (section as HTMLElement).offsetWidth || 1;
      const x = (r.left - sb.left + fx * r.width) / scale, y = (r.top - sb.top + fy * r.height) / scale;
      setPos({ x: Math.min(Math.max(x, 24), 1840), y: Math.min(Math.max(y, 24), 975) });
    };
    const t = setTimeout(measure, 60);   // after the fragment's layout settles
    deck?.on("resize", measure);
    return () => { clearTimeout(t); deck?.off("resize", measure); };
  }, [deck, active, step, i, done, specs.join("|")]);

  if (isPrint()) return null;
  const show = !!pos && !off;
  return (
    <div ref={ref} className={"hand" + (still || done ? " still" : "")} aria-hidden data-hand-on={show ? "1" : "0"}
      style={{ left: (pos?.x ?? 960) - TIP_X, top: pos?.y ?? 540, opacity: show ? 1 : 0 }}>
      <span className="hand-ring" />
      <svg className="hand-svg" width={64} height={92} viewBox="0 0 64 92">
        <g fill="#F4F8FA" stroke="#0B141C" strokeWidth={2.5} strokeLinejoin="round">
          <path d="M23 88 L23 80 Q10 74 8 60 L6 48 Q6 42 12 43 Q16 44 17 50 L18 56 L12 8 Q12 1 19 1 Q26 1 26 8 L27 36 Q33 32 38 36 Q44 33 48 38 Q55 36 57 43 L58 62 Q58 76 50 82 L50 88 Z" />
          <path d="M27 36 L28 50 M38 36 L38.5 50 M48 38 L48.5 52" fill="none" strokeWidth={2} />
        </g>
        <rect x={21} y={84} width={31} height={8} rx={2} fill="#4FD1E8" stroke="#0B141C" strokeWidth={2} />
      </svg>
    </div>
  );
}

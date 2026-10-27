import { useEffect, useState, useSyncExternalStore } from "react";
import { useReveal } from "@revealjs/react";
import { useStep, isPrint } from "../lib/useStep";
import { useReducedMotion } from "../lib/reducedMotion";
import { HAND, HAND_ROUNDS } from "../data/hand";

// Presenter's pointer, an amber Pac-Man: glides to the target(s) for the current click state
// (src/data/hand.ts), chomps at a pellet on the target, and loops through them every DWELL ms (or for HAND_ROUNDS rounds, then rests on the first).
// Hidden in the PDF; X toggles it during the talk; reduced motion keeps it still on the first target.
// The target sits just in front of the mouth: Pac-Man's centre is OFF px below-right of it, mouth facing up-left.
const DWELL = 2800, OFF = 31, BOX = 48, AMBER = "#F2B347";

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
  const calm = still || done;
  const chomp = (to: string) => calm ? null : <animateTransform attributeName="transform" type="rotate" values={`${to};0;${to}`} dur="0.36s" repeatCount="indefinite" />;
  return (
    <div ref={ref} className={"hand" + (calm ? " still" : "")} aria-hidden data-hand-on={show ? "1" : "0"}
      style={{ left: (pos?.x ?? 960) + OFF - BOX, top: (pos?.y ?? 540) + OFF - BOX, opacity: show ? 1 : 0 }}>
      <svg width={2 * BOX} height={2 * BOX} viewBox={`${-BOX} ${-BOX} ${2 * BOX} ${2 * BOX}`}>
        {/* pellet on the target: eaten and replaced in time with the chomping */}
        <circle cx={-OFF} cy={-OFF} r={6} fill={AMBER}>
          {!calm && <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.45;0.5;1" dur="0.72s" repeatCount="indefinite" />}
        </circle>
        {/* drawn facing left (eye on top), then turned 45° so the mouth faces up-left */}
        <g transform="rotate(45) scale(-1,1)" fill={AMBER} stroke="#0B141C" strokeWidth={2}>
          <g transform="rotate(-35)"><path d="M0,0 L29,0 A29,29 0 0,0 -29,0 Z" />{chomp("-35")}</g>
          <g transform="rotate(35)"><path d="M0,0 L-29,0 A29,29 0 0,0 29,0 Z" />{chomp("35")}</g>
        </g>
        <circle cx={12} cy={-9} r={4} fill="#0B141C" />
      </svg>
    </div>
  );
}

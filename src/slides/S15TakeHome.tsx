import { SlideFrame } from "../components/SlideFrame";
import { useStep } from "../lib/useStep";

const C = [
  ["AI is most valuable when it removes repetitive inference", "— picking, triage — while preserving the experimental evidence."],
  ["A visually cleaner result is not automatically a more accurate one", "— more picks, prettier maps and higher confidence can all mislead."],
  ["Validate every AI output at the level of the biological question", "— half maps, viewing directions, local resolution at the site you care about."],
];
export function S15TakeHome() {
  const { ref, step } = useStep<HTMLDivElement>(3);
  return (
    <SlideFrame id="s15">
      <div ref={ref}>
        <h2 style={{ fontSize: 64 }}>Take-home</h2>
        <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {C.map(([a, b], i) => (
            <li key={i} className="stepfade" style={{ opacity: step >= i ? 1 : 0.08, display: "flex", gap: 28, marginBottom: 40 }}>
              <span style={{ fontFamily: "var(--display)", fontSize: 104, fontWeight: 800, color: "var(--accept)", lineHeight: 0.9, width: 60 }}>{i + 1}</span>
              <span style={{ fontSize: 46, lineHeight: 1.22 }}><b>{a}</b> <span className="muted">{b}</span></span>
            </li>
          ))}
        </ol>
        <div className="stepfade" style={{ opacity: step >= 3 ? 1 : 0, marginTop: 30, borderTop: "2px solid var(--rule)", paddingTop: 30, fontSize: 52, fontWeight: 700, lineHeight: 1.25, maxWidth: 1600 }}>
          The goal is not to maximize picks or make the prettiest map.<br />
          <span style={{ color: "var(--accept)" }}>The goal is to preserve structural information — and know when the model is uncertain.</span>
        </div>
      </div>
    </SlideFrame>
  );
}

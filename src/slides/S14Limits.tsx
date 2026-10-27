import { SlideFrame } from "../components/SlideFrame";
import { useStep } from "../lib/useStep";

const base = import.meta.env.BASE_URL;
const PAIRS: [string, string, string][] = [
  ["Data", "Domain shift: microscope, detector, ice, particle size, preprocessing", "Held-out and cross-dataset testing"],
  ["Labels", "Incomplete / subjective annotations; class imbalance; data leakage", "Inspect raw micrographs and 2D classes; split by dataset, not micrograph"],
  ["Physics", "Small particles, overlap, contamination, preferred orientation, missing wedge", "Orientation-distribution and local-resolution analysis"],
  ["Model", "Overconfident scores; threshold sensitivity; over-sharpening; invented or erased density", "Independent half maps the network never saw; compare ≥2 methods"],
  ["Evaluation", "Authors benchmark their own tools; best-of-N reporting; compute cost", "Biochemical validation (mutants, ligands, assays); report uncertainty"],
];
export function S14Limits() {
  const { ref, step } = useStep<HTMLDivElement>(2);
  return (
    <SlideFrame id="s14">
      <div ref={ref} className="row" style={{ gap: 40 }}>
        <div className="col">
          <h2>Limitations, artifacts and safeguards</h2>
          <table style={{ fontSize: 26 }}>
            <thead><tr><th style={{ width: "13%" }}></th><th style={{ color: "var(--reject)" }}>✕ failure mode</th><th className="stepfade" style={{ color: "var(--accept)", opacity: step >= 2 ? 1 : 0 }}>✓ safeguard</th></tr></thead>
            <tbody>{PAIRS.map(([g, f, s]) => (
              <tr key={g} data-hand="fail" className="stepfade" style={{ opacity: step >= 0 ? 1 : 0.1 }}>
                <td className="muted" style={{ fontFamily: "var(--mono)", fontSize: 16 }}>{g.toUpperCase()}</td>
                <td>{f}</td>
                <td data-hand="safe" className="stepfade" style={{ opacity: step >= 2 ? 1 : 0 }}>{s}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
        <div className="stepfade" style={{ width: 520, opacity: step >= 1 ? 1 : 0, paddingTop: 70 }}>
          <p className="panel-label">Missing wedge · x–z slice · SIMULATION</p>
          {[["s14_wedge_truth", "truth (simulated volume)"], ["s14_wedge_rec", "reconstructed from ±60° tilts"], ["s14_wedge_full", "full 180° (impossible in practice)"]].map(([f, t]) => (
            <div key={f} style={{ marginBottom: 10 }}><img data-hand="wedge" src={`${base}figures/${f}.webp`} alt={t} style={{ width: 520 }} /><p className="tiny muted">{t}</p></div>
          ))}
          <p className="tiny" style={{ color: "var(--uncertain)" }}>±60° data smear densities along z and add X-shaped streaks: similarity searches see shapes that depend on orientation.</p>
        </div>
      </div>
    </SlideFrame>
  );
}

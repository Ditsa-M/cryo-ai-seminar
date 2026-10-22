import { SlideFrame } from "../components/SlideFrame";
import { useStep } from "../lib/useStep";
import sub from "../data/generated/s05_subtomo.json";

const base = import.meta.env.BASE_URL;
function Panel({ img, title, tag, h = 250, children }: { img?: string; title: string; tag: string; h?: number; children?: React.ReactNode }) {
  return (
    <div>
      <p className="panel-label" style={{ marginBottom: 4 }}>{title}</p>
      <div style={{ position: "relative", height: h, display: "flex", alignItems: "center" }}>
        {img && <img src={`${base}figures/${img}.webp`} alt={title} style={{ maxHeight: h, maxWidth: "100%" }} />}
        {children}
      </div>
      <p className="tiny" style={{ fontFamily: "var(--mono)", color: "var(--muted)", marginTop: 4 }}>{tag}</p>
    </div>
  );
}
export function S05RawData() {
  const { ref, step } = useStep<HTMLDivElement>(2);
  return (
    <SlideFrame id="s05">
      <div ref={ref}>
        <h2>What the raw data look like</h2>
        <div className="stepfade" style={{ opacity: step >= 0 ? 1 : 0.15 }}>
          <p className="kicker" style={{ color: "#9FE6B4" }}>Measured</p>
          <div style={{ display: "grid", gridTemplateColumns: "300px 300px 1fr", gap: 28 }}>
            <Panel img="s05_frame0" title="1 movie frame (of 49)" tag="EXPERIMENTAL · EMPIAR-10204 · ≈1.3 e⁻/Å²" />
            <Panel img="s07_sum_aligned_dw" title="Aligned frame sum = micrograph" tag="RECOMPUTED from the 49 frames" />
            <Panel img="s05_tilts" title="Tilt series −60° … +60°" tag="SIMULATION · PDB 6CVM + 4V6X" />
          </div>
        </div>
        <div className="stepfade" style={{ opacity: step >= 2 ? 1 : 0, borderTop: "2px dashed var(--uncertain)", margin: "14px 0 8px", position: "relative" }}>
          <span style={{ position: "absolute", right: 0, top: -30, fontFamily: "var(--mono)", fontSize: 18, color: "var(--uncertain)" }}>▲ measured · inferred ▼</span>
        </div>
        <div className="stepfade" style={{ opacity: step >= 1 ? 1 : 0.15 }}>
          <p className="kicker" style={{ color: "#8FD3F4" }}>Inferred</p>
          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 520px 270px", gap: 24 }}>
            <Panel img="s03_tomo_xy" title="Tomogram + 3D coordinates" tag="SIMULATION · ground-truth positions" h={235}>
              <svg viewBox="0 0 1 1" style={{ position: "absolute", left: 0, top: 0, width: 235, height: 235 }}>
                {sub.points.map(([x, y, k], i) => <circle key={i} cx={x as number} cy={y as number} r={0.035} fill="none" stroke={k === "ribosome" ? "#F2B347" : "#4FD1E8"} strokeWidth={0.008} strokeDasharray={k === "ribosome" ? "0.02 0.012" : undefined} />)}
              </svg>
            </Panel>
            <Panel img="s05_boxes" title="Extracted particle boxes" tag="EXPERIMENTAL · EMPIAR-10017 expert coordinates" h={235} />
            <Panel img="s10_classes_tp" title="2D class averages" tag="RECOMPUTED · simplified classification" h={235} />
            <Panel img="s11_deepemhancer_overview" title="3D density map" tag="EXPERIMENTAL · EMD-72202" h={235} />
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}

import { SlideFrame } from "../components/SlideFrame";
import { Video } from "../components/Video";
import { LineChart } from "../components/LineChart";
import { useStep } from "../lib/useStep";
import mo from "../data/generated/s07_motion.json";
import thon from "../data/generated/s07_thon.json";

const base = import.meta.env.BASE_URL;

function Trajectory({ size }: { size: number }) {
  const pts = mo.global_A; const max = 24, s = (size - 40) / max;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Whole-frame drift trajectory">
      {[0, 10, 20].map((t) => <g key={t}><line x1={20 + t * s} x2={20 + t * s} y1={20} y2={size - 20} stroke="#2A3D4C" /><line y1={20 + t * s} y2={20 + t * s} x1={20} x2={size - 20} stroke="#2A3D4C" />
        <text x={20 + t * s} y={size - 4} fill="#8EA2B1" fontSize={15} textAnchor="middle" fontFamily="JetBrains Mono">{t} Å</text></g>)}
      <polyline points={pts.map(([y, x]) => `${20 + x * s},${20 + y * s}`).join(" ")} fill="none" stroke="#4FD1E8" strokeWidth={3} />
      {pts.map(([y, x], i) => <circle key={i} cx={20 + x * s} cy={20 + y * s} r={i === 0 || i === pts.length - 1 ? 6 : 2.5} fill={i === 0 ? "#fff" : "#4FD1E8"} />)}
      <text x={26} y={40} fill="#fff" fontSize={16} fontFamily="JetBrains Mono">frame 1</text>
    </svg>
  );
}
function Patches({ size }: { size: number }) {
  const n = mo.patches.length, cell = size / n, k = 3.2;   // trajectories exaggerated x3.2 for visibility (stated)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Residual local trajectories per patch">
      {mo.patches.flat().map((p) => {
        const out = p.i === mo.outlier[0] && p.j === mo.outlier[1];
        const cx = (p.j + 0.5) * cell, cy = (p.i + 0.5) * cell;
        return (
          <g key={`${p.i}-${p.j}`}>
            <rect x={p.j * cell + 2} y={p.i * cell + 2} width={cell - 4} height={cell - 4} fill="#14232F" stroke={out ? "#F2B347" : "#2A3D4C"} strokeWidth={out ? 3 : 1} strokeDasharray={out ? "7 5" : undefined} />
            <polyline points={p.traj.map(([y, x]) => `${cx + x * k},${cy + y * k}`).join(" ")} fill="none" stroke={out ? "#F2B347" : "#4FD1E8"} strokeWidth={2} />
          </g>
        );
      })}
    </svg>
  );
}
export function S07Motion() {
  const { ref, step } = useStep<HTMLDivElement>(3);
  const out = mo.patches[mo.outlier[0]][mo.outlier[1]];
  return (
    <SlideFrame id="s07">
      <div ref={ref}>
        <h2>Motion correction: undoing a {mo.total_drift_A} Å drift</h2>
        <div className="row" style={{ gap: 30 }}>
          <div style={{ width: 820 }}>
            <p className="panel-label">Real movie, 7 groups of 7 frames (1.77 Å/px crop)</p>
            <Video name="motion-align" kind="once" play={step >= 0} alt="Frame groups drift, then are aligned and summed (real EMPIAR-10204 data)" />
            <p className="figcap">Plays once and holds. Drift measured by presenter's cross-correlation alignment (not MotionCor2).</p>
          </div>
          <div className="stepfade" style={{ opacity: step >= 1 ? 1 : 0, width: 520 }}>
            <p className="panel-label">Global trajectory · power spectra (Thon rings)</p>
            <div className="row" style={{ gap: 10 }}>
              <Trajectory size={220} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div><img src={`${base}figures/s07_psd_unaligned.webp`} alt="Power spectrum of unaligned sum" style={{ width: 140 }} /><p className="tiny muted">unaligned</p></div>
                <div><img src={`${base}figures/s07_psd_aligned.webp`} alt="Power spectrum of aligned sum" style={{ width: 140 }} /><p className="tiny muted">aligned</p></div>
              </div>
            </div>
            <LineChart w={520} h={250} xLabel="spatial frequency (1/Å)" yLabel="Thon-ring amplitude" xDomain={[0.02, 0.16]} yDomain={[-0.4, 0.8]} yTicks={[0, 0.5]} xTicks={[0.05, 0.1, 0.15]}
              series={[{ key: "u", label: "unaligned", x: thon.freq, y: thon.unaligned, color: "#E8559A", dash: "6 5" }, { key: "a", label: "aligned", x: thon.freq, y: thon.aligned, color: "#4FD1E8" }]} />
            <div className="legend tiny"><span style={{ color: "#4FD1E8" }}>━ aligned</span><span style={{ color: "#E8559A" }}>╍ unaligned</span></div>
          </div>
          <div className="stepfade col" style={{ opacity: step >= 2 ? 1 : 0 }}>
            <p className="panel-label">Local patches: residual motion (×3.2)</p>
            <Patches size={300} />
            <p className="tiny" style={{ color: "var(--uncertain)", marginTop: 6 }}>╍ corner patch: {out.max_A} Å excursion — little signal, probably noise. Bad local estimates propagate into CTF fitting.</p>
          </div>
        </div>
        <div className="callout stepfade" style={{ opacity: step >= 3 ? 1 : 0, marginTop: 10 }}>
          MotionCor2, RELION polishing, cryoSPARC patch motion: <b>conventional optimization, not deep learning.</b> Dose weighting then down-weights late, damaged frames.
        </div>
      </div>
    </SlideFrame>
  );
}

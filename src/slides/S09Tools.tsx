import { SlideFrame } from "../components/SlideFrame";
import { Video } from "../components/Video";
import { useStep } from "../lib/useStep";

const NN = "#A88BFA";
function TopazSketch() {
  // 8x5 grid of candidate windows: 4 labelled positives (cyan solid), the rest unlabeled (grey '?').
  const lab = new Set([3, 12, 21, 30]);
  return (
    <svg viewBox="0 0 520 230" width="100%" role="img" aria-label="Topaz schematic: few labelled positives, unlabeled rest, CNN, score map">
      {Array.from({ length: 40 }, (_, i) => {
        const x = 10 + (i % 8) * 26, y = 20 + Math.floor(i / 8) * 26;
        return lab.has(i) ? <circle key={i} cx={x + 11} cy={y + 11} r={10} className="p-acc" /> :
          <text key={i} x={x + 11} y={y + 17} fontSize={15} fill="#5A6E7D" textAnchor="middle">?</text>;
      })}
      <text x={110} y={175} fill="#C3D0D9" fontSize={17} textAnchor="middle">few positives · rest unlabeled</text>
      <text x={110} y={197} fill="#8EA2B1" fontSize={15} textAnchor="middle">(not negative!)</text>
      {[0, 1, 2, 3].map((k) => <rect key={k} x={235 + k * 16} y={40 + k * 8} width={34} height={110 - k * 16} fill="rgba(168,139,250,.18)" stroke={NN} strokeWidth={2} />)}
      <text x={275} y={185} fill={NN} fontSize={16} textAnchor="middle" fontFamily="JetBrains Mono">CNN, prior π</text>
      <defs><linearGradient id="heat" x1="0" x2="1"><stop offset="0" stopColor="#14232F" /><stop offset="1" stopColor={NN} /></linearGradient></defs>
      {Array.from({ length: 25 }, (_, i) => <rect key={i} x={370 + (i % 5) * 28} y={25 + Math.floor(i / 5) * 28} width={26} height={26} fill={NN} fillOpacity={[0.1, 0.8, 0.15, 0.2, 0.9, 0.1, 0.2, 0.85, 0.1, 0.15, 0.7, 0.1, 0.12, 0.2, 0.75, 0.1, 0.9, 0.2, 0.1, 0.15, 0.2, 0.1, 0.8, 0.15, 0.1][i]} />)}
      <text x={440} y={185} fill="#C3D0D9" fontSize={16} textAnchor="middle">score map → threshold</text>
      <text x={440} y={205} fill="#C3D0D9" fontSize={16} textAnchor="middle">→ 2D coordinates</text>
    </svg>
  );
}
function YoloSketch() {
  const boxes = [[1, 1, 0.97], [3, 2, 0.91], [5, 1, 0.64], [2, 4, 0.88], [4, 4, 0.42]];
  return (
    <svg viewBox="0 0 520 230" width="100%" role="img" aria-label="crYOLO schematic: grid cells predict boxes with confidence">
      <rect x={10} y={10} width={240} height={200} fill="#1B2C3A" />
      {Array.from({ length: 7 }, (_, i) => <line key={"v" + i} x1={10 + i * 40} x2={10 + i * 40} y1={10} y2={210} stroke="#2A3D4C" />)}
      {Array.from({ length: 6 }, (_, i) => <line key={"h" + i} y1={10 + i * 40} y2={10 + i * 40} x1={10} x2={250} stroke="#2A3D4C" />)}
      {boxes.map(([cx, cy, c], i) => (
        <g key={i}>
          <rect x={10 + cx * 40 - 4} y={10 + cy * 40 - 4} width={48} height={48} fill="none" stroke={c > 0.6 ? "#4FD1E8" : "#F2B347"} strokeWidth={2.5} strokeDasharray={c > 0.6 ? undefined : "6 4"} />
          <text x={10 + cx * 40 + 20} y={10 + cy * 40 - 8} fontSize={14} fill="#fff" textAnchor="middle" fontFamily="JetBrains Mono">{c}</text>
        </g>
      ))}
      <text x={385} y={70} fill="#C3D0D9" fontSize={18} textAnchor="middle">one pass of a CNN:</text>
      <text x={385} y={98} fill="#C3D0D9" fontSize={18} textAnchor="middle">each grid cell predicts</text>
      <text x={385} y={126} fill="#C3D0D9" fontSize={18} textAnchor="middle">box + confidence</text>
      <text x={385} y={170} fill={NN} fontSize={16} textAnchor="middle" fontFamily="JetBrains Mono">supervised · YOLO</text>
    </svg>
  );
}
function EmbeddingSketch() {
  const cl = [{ c: [70, 60], col: "#4FD1E8", n: 9 }, { c: [160, 120], col: "#F2B347", n: 8 }, { c: [80, 160], col: "#E8559A", n: 7 }];
  let seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5);
  return (
    <svg viewBox="0 0 230 200" width="100%" role="img" aria-label="Embedding space schematic: same protein clusters together">
      <rect x={0} y={0} width={230} height={200} fill="#14232F" />
      {cl.map((k, j) => Array.from({ length: k.n }, (_, i) => {
        const x = k.c[0] + r() * 46, y = k.c[1] + r() * 40;
        return j === 1 ? <rect key={`${j}-${i}`} x={x - 4} y={y - 4} width={8} height={8} fill={k.col} /> :
          j === 2 ? <path key={`${j}-${i}`} d={`M${x},${y - 5} L${x + 5},${y + 4} L${x - 5},${y + 4} z`} fill={k.col} /> :
            <circle key={`${j}-${i}`} cx={x} cy={y} r={4.5} fill={k.col} />;
      }))}
      <text x={115} y={194} fill="#8EA2B1" fontSize={13} textAnchor="middle" fontFamily="JetBrains Mono">32-D embedding (2-D view)</text>
    </svg>
  );
}
const TABLE = [
  ["Input", "2D micrographs", "2D micrographs", "3D tomograms (~10 Å/px)"],
  ["Learning", "positive-unlabeled CNN", "supervised YOLO detection", "deep metric learning (triplets)"],
  ["Output", "score map → 2D coordinates", "boxes + confidence", "embeddings → 3D coordinates"],
  ["Labels needed", "a few positives per dataset", "200–2,500 boxes, or general model", "none to retrain: 1 reference or clustering"],
  ["Best use", "large SPA sets, few labels", "fast, on-the-fly picking", "crowded tomograms, known/related proteins"],
  ["Main limit", "threshold & prior choice; incomplete labels", "needs representative training boxes", "≳150 kDa; no conformations at picking"],
];
export function S09Tools() {
  const { ref, step } = useStep<HTMLDivElement>(3);
  return (
    <SlideFrame id="s09">
      <div ref={ref}>
        <h2>Topaz, crYOLO and TomoTwin: three learning ideas</h2>
        <div className="grid3">
          <div className="card nn stepfade" style={{ opacity: step >= 0 ? 1 : 0.1 }}><h3>Topaz <span className="tiny muted">Bepler 2019</span></h3><TopazSketch /></div>
          <div className="card nn stepfade" style={{ opacity: step >= 1 ? 1 : 0.1 }}><h3>crYOLO <span className="tiny muted">Wagner 2019</span></h3><YoloSketch /></div>
          <div className="card nn stepfade" style={{ opacity: step >= 2 ? 1 : 0.1 }}><h3>TomoTwin <span className="tiny muted">Rice 2023</span></h3>
            <div className="row" style={{ gap: 10 }}>
              <div style={{ width: 270 }}><Video name="tomo-scan" kind="loop" alt="37-voxel search box scanning a simulated tomogram (decorative loop)" /><p className="tiny muted">37³ subvolumes → 3D CNN</p></div>
              <div className="col"><EmbeddingSketch /></div>
            </div>
          </div>
        </div>
        <table className="stepfade" style={{ marginTop: 16, fontSize: 23, opacity: step >= 3 ? 1 : 0 }}>
          <thead><tr><th style={{ width: "13%" }}></th><th>Topaz</th><th>crYOLO</th><th>TomoTwin</th></tr></thead>
          <tbody>{TABLE.map((r) => <tr key={r[0]}><td className="muted">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody>
        </table>
      </div>
    </SlideFrame>
  );
}

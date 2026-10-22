import { SlideFrame } from "../components/SlideFrame";
import { useStep } from "../lib/useStep";

type Box = { id: string; label: string; x: number; y: number; dl?: string; focus?: boolean; note?: string };
const W = 200, H = 78;
const SPA: Box[] = [
  { id: "mov", label: "Movies", x: 0, y: 0 },
  { id: "mc", label: "Motion correction", x: 1, y: 0, focus: true, note: "optimization" },
  { id: "ctf", label: "CTF estimation", x: 2, y: 0, note: "physical model fit" },
  { id: "pick", label: "Particle picking", x: 3, y: 0, dl: "Topaz · crYOLO", focus: true },
  { id: "cls", label: "2D/3D classification", x: 4, y: 0, dl: "cryoDRGN …" },
  { id: "rec", label: "Ab initio + refinement", x: 5, y: 0, dl: "CryoAI", note: "pose inference" },
  { id: "enh", label: "Sharpen / denoise", x: 6, y: 0, dl: "DeepEMhancer", focus: true },
  { id: "mod", label: "Model building", x: 7, y: 0, dl: "Cryo2Struct", note: "" },
];
const ET: Box[] = [
  { id: "tilt", label: "Tilt series", x: 0, y: 1 },
  { id: "mc2", label: "Motion correction", x: 1, y: 1 },
  { id: "aln", label: "Tilt alignment", x: 2, y: 1 },
  { id: "tomo", label: "Tomogram reconstruction", x: 3, y: 1, dl: "denoising / IsoNet" },
  { id: "spick", label: "Subtomogram picking", x: 4, y: 1, dl: "TomoTwin", focus: true },
  { id: "sta", label: "Subtomogram averaging", x: 5, y: 1 },
];
export function S06Workflow() {
  const { ref, step } = useStep<HTMLDivElement>(2);
  const X = (b: Box) => 10 + b.x * 222, Y = (b: Box) => 40 + b.y * 220;
  const draw = (b: Box, vis: boolean, i: number, arr: Box[]) => (
    <g key={b.id} className="stepfade" style={{ opacity: vis ? 1 : 0 }}>
      <rect x={X(b)} y={Y(b)} width={W} height={H} rx={4} fill="#14232F" stroke={b.focus ? "#4FD1E8" : "#2A3D4C"} strokeWidth={b.focus ? 3 : 1.5} />
      <text x={X(b) + W / 2} y={Y(b) + H / 2 + (b.label.length > 15 ? -4 : 8)} textAnchor="middle" fontSize={21} fontWeight={600} fill="#EEF3F6">
        {b.label.length > 15 ? (() => { const w = b.label.split(" "); const k = Math.ceil(w.length / 2); return [w.slice(0, k).join(" "), w.slice(k).join(" ")].map((t, j) => <tspan key={j} x={X(b) + W / 2} dy={j ? 24 : 0}>{t}</tspan>); })() : b.label}
      </text>
      {b.note && <text x={X(b) + W / 2} y={Y(b) - 10} textAnchor="middle" fontSize={16} fill="#8EA2B1" fontFamily="JetBrains Mono">{b.note}</text>}
      {i < arr.length - 1 && <line x1={X(b) + W} x2={X(b) + 222} y1={Y(b) + H / 2} y2={Y(b) + H / 2} stroke="#8EA2B1" strokeWidth={2} markerEnd="url(#arr2)" />}
      {b.dl && (
        <g className="stepfade" style={{ opacity: step >= 2 ? 1 : 0 }}>
          <rect x={X(b) + 6} y={Y(b) + H + 12} width={W - 12} height={40} rx={20} fill="rgba(168,139,250,.15)" stroke="#A88BFA" strokeWidth={2} />
          <text x={X(b) + W / 2} y={Y(b) + H + 39} textAnchor="middle" fontSize={17} fill="#D9C2FF" fontFamily="JetBrains Mono">◆ {b.dl}</text>
        </g>
      )}
    </g>
  );
  return (
    <SlideFrame id="s06">
      <div ref={ref}>
        <h2>End-to-end workflow — where deep learning has entered</h2>
        <svg viewBox="0 0 1800 440" width={1792} role="img" aria-label="Branched cryo-EM and cryo-ET workflow">
          <defs><marker id="arr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#8EA2B1" /></marker></defs>
          <text x={10} y={22} fontSize={18} fill="#4FD1E8" fontFamily="JetBrains Mono">SINGLE-PARTICLE ANALYSIS</text>
          <text x={10} y={242} fontSize={18} fill="#F2B347" fontFamily="JetBrains Mono" className="stepfade" style={{ opacity: step >= 1 ? 1 : 0 }}>CRYO-ELECTRON TOMOGRAPHY</text>
          {SPA.map((b, i, a) => draw(b, step >= 0, i, a))}
          {ET.map((b, i, a) => draw(b, step >= 1, i, a))}
        </svg>
        <div className="row stepfade" style={{ opacity: step >= 2 ? 1 : 0, gap: 28, marginTop: 4 }}>
          <div className="card nn col"><b>CryoAI</b> (Levy et al. 2022): learned encoder predicts each particle's pose; physics-based decoder; ab initio, homogeneous; reported ≈ one order of magnitude faster on large datasets.</div>
          <div className="card nn col"><b>Cryo2StructData</b> (Giri et al. 2024): 7,600 density maps with voxels labelled from atomic structures, to train and test model-building networks.</div>
          <div className="card acc col"><b>Today's focus</b> (cyan boxes): motion → picking → enhancement — where errors are born and propagate.</div>
        </div>
      </div>
    </SlideFrame>
  );
}

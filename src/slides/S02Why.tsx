import { SlideFrame } from "../components/SlideFrame";
import { Pipeline } from "../components/Pipeline";
import { LineChart } from "../components/LineChart";
import { useStep } from "../lib/useStep";
import bench from "../data/benchmarks.json";

// Dose vs. signal, computed from Grant & Grigorieff 2015 (eLife 4:e06980), not a reproduced figure.
// Critical exposure at 300 kV: Ne(k) = 0.245·k^-1.665 + 2.81 e⁻/Å² (Eq. 3 fit); per-frame SNR at
// resolution k fades as exp(-N/Ne) (Eq. 1), so signal amplitude fades as exp(-N/2Ne). Summing frames
// up to total dose N gives SNR ∝ 2Ne(1 - exp(-N/2Ne)) / √N, which peaks at N ≈ 2.5·Ne (paper, Fig. 5B).
const Ne = (dA: number) => 0.245 * Math.pow(1 / dA, -1.665) + 2.81;
const snr = (n: number, ne: number) => (n <= 0 ? 0 : (2 * ne * (1 - Math.exp(-n / (2 * ne)))) / Math.sqrt(n));
const DOSE = Array.from({ length: 241 }, (_, i) => i * 0.25);   // 0–60 e⁻/Å²
const OPT = 2.513;   // argmax of (1 - e^-x)/√x is x = 1.2564, i.e. N = 2.513·Ne
const RES = [
  { d: 3, color: "#E0F9FD" },
  { d: 4, color: "#8FE6F2" },
  { d: 8, color: "#4FB8D0" },
  { d: 20, color: "#3A88A3" },
].map((r) => {
  const ne = Ne(r.d), peak = snr(Math.min(OPT * ne, 60), ne);
  return { ...r, ne, opt: OPT * ne, y: DOSE.map((n) => snr(n, ne) / peak) };
});

export function S02Why() {
  const { ref, step } = useStep<HTMLDivElement>(2);
  const maxPicks = Math.max(...Object.values(bench.datasets).flatMap((d) => d.results.map((r) => r.empiar_particles)));
  const nums = [
    { big: "1,879", txt: "public EMPIAR datasets (4.83 PB) by 14 Jan 2025", src: "Iqbal et al. 2026" },
    { big: maxPicks.toLocaleString("en-US"), txt: "particles picked by one tool on one dataset (Topaz, EMPIAR-10093)", src: "Dhakal et al. 2025, Table 3" },
    { big: "≈570", txt: "particles per micrograph picked by hand by an expert (6,829 in 12 micrographs)", src: "EMPIAR-10017 coordinates" },
  ];
  return (
    <SlideFrame id="s02">
      <div ref={ref}>
        <h2>Why AI-assisted processing matters</h2>
        <div style={{ display: "flex", gap: 44, marginTop: 18 }}>
          <div className="stepfade" style={{ width: 1060, opacity: step >= 0 ? 1 : 0.08 }}>
            <p className="panel-label">Signal: the electrons that form the image also destroy the specimen</p>
            <div style={{ display: "flex", gap: 26, fontSize: 20, margin: "6px 0 0 78px" }}>
              {RES.map((r) => (
                <span key={r.d} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <svg width={28} height={10}><line x1={0} x2={28} y1={5} y2={5} stroke={r.color} strokeWidth={3} /></svg>
                  {r.d} Å detail
                </span>
              ))}
            </div>
            <LineChart w={1060} h={380} xLabel="total electron dose (e⁻/Å²)" yLabel="SNR (rel. to its best)" xDomain={[0, 60]} yDomain={[0, 1.05]}
              xTicks={[0, 10, 20, 30, 40, 50, 60]} yTicks={[0, 0.5, 1]}
              refLines={[{ x: 24, label: "", color: "#F2B347" }]}
              series={RES.map((r) => ({ key: `d${r.d}`, label: `${r.d} Å`, x: DOSE, y: r.y, color: r.color, width: 3 }))}>
              {(sx, sy) => [
                <text key="mark" x={sx(24) + 10} y={sy(0.08)} fill="#F2B347" fontSize={18} fontFamily="JetBrains Mono">24 e⁻/Å²: the micrograph you just saw</text>,
                ...RES.filter((r) => r.opt <= 60).map((r) => (
                <g key={r.d}>
                  <circle cx={sx(r.opt)} cy={sy(1)} r={7} fill={r.color} stroke="#0B141C" strokeWidth={2} />
                  <text x={sx(r.opt)} y={sy(1) - 16} textAnchor="middle" fill="#C3D0D9" fontSize={17} fontFamily="JetBrains Mono">{Math.round(r.opt)}</text>
                </g>
              ))]}
            </LineChart>
            <p className="figcap" style={{ fontSize: 19 }}>
              Dots: the best total dose for each resolution (≈2.5 × its critical exposure). Fine detail peaks after ~11 e⁻/Å² and is then
              destroyed faster than new electrons add to it; coarse detail, which alignment needs, keeps improving. So the dose is capped
              and every particle stays in noise. Computed from the 300 kV fit of Grant &amp; Grigorieff 2015.
            </p>
          </div>
          <div className="stepfade" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, opacity: step >= 1 ? 1 : 0.08 }}>
            {nums.map((n) => (
              <div key={n.big} className="card">
                <div className="big-number" style={{ fontSize: 60 }}>{n.big}</div>
                <p style={{ fontSize: 23, margin: "8px 0 2px" }}>{n.txt}</p>
                <p className="tiny muted" style={{ fontFamily: "var(--mono)", margin: 0 }}>{n.src}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          <p className="panel-label">Speed is not the goal — errors propagate</p>
          <Pipeline errorAt={step >= 2 ? 3 : -1} spread={step >= 2 ? 7 : -1} />
        </div>
      </div>
    </SlideFrame>
  );
}

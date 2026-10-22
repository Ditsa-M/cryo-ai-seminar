import { SlideFrame } from "../components/SlideFrame";
import { useStep } from "../lib/useStep";
import * as d3 from "d3";
import bench from "../data/benchmarks.json";

export function S12Benchmark() {
  const { ref, step } = useStep<HTMLDivElement>(5);
  const rows = bench.average;
  const W = 1780, rowH = 58, top = 46, nameW = 230, barW = 560, gap = 70, dotX0 = nameW + barW + gap, dotW = W - dotX0 - 40;
  const sCount = d3.scaleLinear().domain([0, 220000]).range([0, barW]);
  const sRes = d3.scaleLinear().domain([3, 6.5]).range([0, dotW]);
  const hi = (m: string) => step >= 3 && (m === "Topaz" || m === "CryoSegNet");
  return (
    <SlideFrame id="s12">
      <div ref={ref}>
        <h2>Case study: six pickers, same data, same reconstruction protocol</h2>
        <svg viewBox={`0 0 ${W} ${top + rowH * 6 + 50}`} width={W} role="img" aria-label="Average particle counts and best resolution for six pickers (Dhakal et al. 2025, Table 3)">
          <text x={nameW} y={24} fill="#C3D0D9" fontSize={20} className="stepfade" style={{ opacity: step >= 1 ? 1 : 0 }}>Particles picked (full EMPIAR, mean of 4 datasets)</text>
          <text x={dotX0} y={24} fill="#C3D0D9" fontSize={20} className="stepfade" style={{ opacity: step >= 2 ? 1 : 0 }}>Best resolution of 3 trials, mean of 4 proteins (Å) — ← lower is better</text>
          {rows.map((r, i) => {
            const y = top + i * rowH;
            return (
              <g key={r.method} className="stepfade" style={{ opacity: step >= 0 ? (step >= 3 && !hi(r.method) ? 0.35 : 1) : 0 }}>
                {hi(r.method) && <rect x={0} y={y + 2} width={W} height={rowH - 4} fill="rgba(242,179,71,.10)" stroke="#F2B347" strokeDasharray="6 5" />}
                <text x={12} y={y + rowH / 2 + 8} fill="#fff" fontSize={26} fontWeight={700}>{r.method}</text>
                <g className="stepfade" style={{ opacity: step >= 1 ? 1 : 0 }}>
                  <rect x={nameW} y={y + 14} width={sCount(r.empiar_particles)} height={rowH - 28} fill="#5A6E7D" rx={3} />
                  <text x={nameW + sCount(r.empiar_particles) + 10} y={y + rowH / 2 + 7} fill="#EEF3F6" fontSize={20} fontFamily="JetBrains Mono">{r.empiar_particles.toLocaleString("en-US")}</text>
                </g>
                <g className="stepfade" style={{ opacity: step >= 2 ? 1 : 0 }}>
                  <line x1={dotX0 + sRes(r.empiar_res_A)} x2={dotX0 + sRes(r.cryoppp_res_A)} y1={y + rowH / 2} y2={y + rowH / 2} stroke="#2A3D4C" strokeWidth={4} />
                  <circle cx={dotX0 + sRes(r.cryoppp_res_A)} cy={y + rowH / 2} r={10} fill="none" stroke="#F2B347" strokeWidth={3} strokeDasharray="4 3" />
                  <circle cx={dotX0 + sRes(r.empiar_res_A)} cy={y + rowH / 2} r={10} fill="#4FD1E8" />
                  <text x={dotX0 + sRes(r.empiar_res_A) - 16} y={y + rowH / 2 + 7} fill="#4FD1E8" fontSize={19} textAnchor="end" fontFamily="JetBrains Mono">{r.empiar_res_A.toFixed(2)}</text>
                  <text x={dotX0 + sRes(r.cryoppp_res_A) + 16} y={y + rowH / 2 + 7} fill="#F2B347" fontSize={19} fontFamily="JetBrains Mono">{r.cryoppp_res_A.toFixed(2)}</text>
                </g>
              </g>
            );
          })}
          <g className="stepfade" style={{ opacity: step >= 2 ? 1 : 0 }}>
            {[3, 4, 5, 6].map((t) => <text key={t} x={dotX0 + sRes(t)} y={top + rowH * 6 + 26} fill="#8EA2B1" fontSize={18} textAnchor="middle" fontFamily="JetBrains Mono">{t} Å</text>)}
            <circle cx={dotX0 + 10} cy={top + rowH * 6 + 44} r={8} fill="#4FD1E8" /><text x={dotX0 + 26} y={top + rowH * 6 + 50} fill="#C3D0D9" fontSize={18}>full EMPIAR (all micrographs)</text>
            <circle cx={dotX0 + 360} cy={top + rowH * 6 + 44} r={8} fill="none" stroke="#F2B347" strokeWidth={3} strokeDasharray="4 3" /><text x={dotX0 + 376} y={top + rowH * 6 + 50} fill="#C3D0D9" fontSize={18}>CryoPPP subset (~300 micrographs)</text>
          </g>
        </svg>
        <div className="grid3" style={{ gap: 20, marginTop: 6 }}>
          <div className="callout stepfade" style={{ opacity: step >= 3 ? 1 : 0, fontSize: 21 }}>
            <b>More particles ≠ better map.</b> Topaz picked ~2× CryoSegNet's particles yet averaged 3.46 vs 3.28 Å. Hemagglutinin: 259,757 vs 90,477 particles → 3.21 vs 3.20 Å.
          </div>
          <div className="callout mag stepfade" style={{ opacity: step >= 4 ? 1 : 0, fontSize: 21 }}>
            <b>Benchmark-specific:</b> best of 3 seeds; 4 proteins; CryoSegNet not best everywhere — on EMPIAR-10093 Topaz is best in both subsets. Text credits CryoTransformer; Table 3 says Topaz <b>6.12</b> vs 6.81 Å (table used). Two winners are from the reviewers' own group.
          </div>
          <div className="callout cyan stepfade" style={{ opacity: step >= 5 ? 1 : 0, fontSize: 21 }}>
            <b>What explained the differences?</b> The authors point to <b>viewing-direction coverage</b>: pickers that missed orientations lost resolution. Validate with orientation plots and half-map FSC, not counts.
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}

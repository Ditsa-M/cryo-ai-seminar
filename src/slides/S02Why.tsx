import { SlideFrame } from "../components/SlideFrame";
import { Pipeline } from "../components/Pipeline";
import { useStep } from "../lib/useStep";
import bench from "../data/benchmarks.json";

export function S02Why() {
  const { ref, step } = useStep<HTMLDivElement>(1);
  const maxPicks = Math.max(...Object.values(bench.datasets).flatMap((d) => d.results.map((r) => r.empiar_particles)));
  const nums = [
    { big: "24 e⁻/Å²", txt: "total dose in the micrograph you just saw — every particle sits in noise", src: "EMPIAR-10017" },
    { big: "1,879", txt: "public EMPIAR datasets (4.83 PB) by 14 Jan 2025", src: "Iqbal et al. 2026" },
    { big: maxPicks.toLocaleString("en-US"), txt: "particles picked by one tool on one dataset (Topaz, EMPIAR-10093)", src: "Dhakal et al. 2025, Table 3" },
    { big: "≈570", txt: "particles per micrograph picked by hand by an expert (6,829 in 12 micrographs)", src: "EMPIAR-10017 coordinates" },
  ];
  return (
    <SlideFrame id="s02">
      <div ref={ref}>
        <h2>Why AI-assisted processing matters</h2>
        <div className="grid3 stepfade" style={{ gridTemplateColumns: "repeat(4, 1fr)", opacity: step >= 0 ? 1 : 0.15 }}>
          {nums.map((n) => (
            <div key={n.big} className="card">
              <div className="big-number">{n.big}</div>
              <p style={{ fontSize: 28, marginTop: 14 }}>{n.txt}</p>
              <p className="tiny muted" style={{ fontFamily: "var(--mono)" }}>{n.src}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 90 }}>
          <p className="panel-label">Speed is not the goal — errors propagate</p>
          <Pipeline errorAt={step >= 1 ? 3 : -1} spread={step >= 1 ? 7 : -1} />
          <p className="stepfade" style={{ opacity: step >= 1 ? 1 : 0, fontSize: 32, marginTop: 16 }}>
            A wrong pick, a bad drift estimate or an over-sharpened map does not stay local: it reaches the structure and the biological claim.
          </p>
        </div>
      </div>
    </SlideFrame>
  );
}

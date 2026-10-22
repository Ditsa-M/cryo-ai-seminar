import { SlideFrame } from "../components/SlideFrame";
import { LineChart } from "../components/LineChart";
import { useStep } from "../lib/useStep";
import pr from "../data/generated/s10_pr.json";
import ctp from "../data/generated/s10_classes_tp.json";
import cfp from "../data/generated/s10_classes_fp.json";
import cfn from "../data/generated/s10_classes_fn.json";

const base = import.meta.env.BASE_URL;
export function S10Interpret() {
  const { ref, step } = useStep<HTMLDivElement>(3);
  const c = pr.curve.filter((d) => d.t >= -3 && d.t <= 8);
  const b = pr.best;
  // threshold marker sweeps high -> low with the click (CSS transition on the group)
  const markT = step >= 1 ? b.threshold : step >= 0 ? 0 : 5;
  const at = (t: number) => c.reduce((a, d) => (Math.abs(d.t - t) < Math.abs(a.t - t) ? d : a), c[0]);
  const m = at(markT);
  return (
    <SlideFrame id="s10">
      <div ref={ref}>
        <h2>Reading picker output: metrics first, structure last</h2>
        <div className="row" style={{ gap: 36 }}>
          <div style={{ width: 760 }}>
            <p className="panel-label">Topaz (pretrained) vs {pr.n_truth.toLocaleString("en-US")} expert picks · {pr.micrographs} real micrographs</p>
            <LineChart w={760} h={420} xLabel="Topaz score threshold (lower = more picks)" yLabel="value" xDomain={[8, -3]} yDomain={[0, 1]} yTicks={[0, 0.25, 0.5, 0.75, 1]} xTicks={[8, 6, 4, 2, 0, -2]}
              series={[
                { key: "p", label: "precision", x: c.map((d) => d.t), y: c.map((d) => d.p), color: "#4FD1E8" },
                { key: "r", label: "recall", x: c.map((d) => d.t), y: c.map((d) => d.r), color: "#F2B347", dash: "8 6" },
                { key: "f", label: "F1", x: c.map((d) => d.t), y: c.map((d) => d.f1), color: "#FFFFFF", width: 3.5 },
              ]}>
              {(sx, sy) => (
                <g className="stepfade" style={{ opacity: step >= 0 ? 1 : 0 }}>
                  <line x1={sx(m.t)} x2={sx(m.t)} y1={sy(1)} y2={sy(0)} stroke="#A88BFA" strokeWidth={3} style={{ transition: "all .9s ease" }} />
                  <text data-testid="thr-label" x={sx(m.t) + (m.t < 4 ? -8 : 8)} textAnchor={m.t < 4 ? "end" : "start"} y={sy(0.06)} fill="#D9C2FF" fontSize={19} fontFamily="JetBrains Mono" style={{ transition: "all .9s ease" }}>
                    {m.n.toLocaleString("en-US")} picks · P {m.p.toFixed(2)} · R {m.r.toFixed(2)}
                  </text>
                  {step >= 1 && <circle cx={sx(b.threshold)} cy={sy(b.f1)} r={9} fill="none" stroke="#fff" strokeWidth={3} />}
                </g>
              )}
            </LineChart>
            <div className="legend tiny"><span style={{ color: "#4FD1E8" }}>━ precision: picks that match expert</span><span style={{ color: "#F2B347" }}>╍ recall: expert picks found</span><span>━ F1 = 2PR/(P+R)</span></div>
            <p className="tiny stepfade" style={{ opacity: step >= 1 ? 1 : 0 }}>Best F1 <b>{b.f1.toFixed(2)}</b> at threshold {b.threshold} ({b.picks.toLocaleString("en-US")} picks). Topaz retrained on only 25% of labels: F1 <b>{pr.heldout.pu25.f1.toFixed(2)}</b> on held-out micrographs (pretrained {pr.heldout.pretrained.f1.toFixed(2)}).</p>
          </div>
          <div className="col">
            <div className="stepfade" style={{ opacity: step >= 2 ? 1 : 0 }}>
              <p className="panel-label">Simplified 2D classes of each pick set</p>
              {([["tp", "Agreed picks", ctp, "p-acc"], ["fp", "\"False positives\" (model only)", cfp, "p-unc"], ["fn", "Missed (expert only)", cfn, "p-mis"]] as const).map(([k, label, meta]) => (
                <div key={k} style={{ marginBottom: 8 }}>
                  <div className="tiny"><b>{label}</b> · {meta.total.toLocaleString("en-US")} picks</div>
                  <img src={`${base}figures/s10_classes_${k}.webp`} alt={`2D class averages: ${label}`} style={{ height: 112 }} />
                </div>
              ))}
              <p className="tiny" style={{ color: "var(--uncertain)" }}>Several "false-positive" classes look like real β-galactosidase views: the labels were incomplete. Largest class = off-centre / overlapping neighbours.</p>
            </div>
            <div className="callout cyan stepfade" style={{ opacity: step >= 3 ? 1 : 0, fontSize: 21 }}>
              <b>Judge downstream:</b> clean 2D classes · viewing-direction coverage · rare views kept · gold-standard FSC of independent half maps (read at 0.143) · local resolution · is the biology complete? <b>More particles ≠ better.</b>
            </div>
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}

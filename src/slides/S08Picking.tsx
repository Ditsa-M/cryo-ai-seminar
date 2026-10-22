import { SlideFrame } from "../components/SlideFrame";
import { Micrograph, ParticleLegend, overlayCounts } from "../components/Micrograph";
import { useStep } from "../lib/useStep";
import pr from "../data/generated/s10_pr.json";

export function S08Picking() {
  const { ref, step } = useStep<HTMLDivElement>(3);
  const show = (["matched", "model_only", "expert_only"] as const).filter((_, i) => step >= i);
  const b = pr.best;
  return (
    <SlideFrame id="s08">
      <div ref={ref} className="row" style={{ gap: 48 }}>
        <div style={{ width: 860 }}>
          <Micrograph size={820} filtered={1} show={[...show, ...(step >= 3 ? ["rejected" as const] : [])]} />
        </div>
        <div className="col">
          <h2 style={{ fontSize: 50 }}>Particle picking is inference, not detection</h2>
          <ul style={{ fontSize: 26 }}>
            <li>Low contrast: dose-limited SNR</li>
            <li>Ice, carbon edges and contamination look like particles</li>
            <li>Touching, overlapping and aggregated particles</li>
            <li>Variable size, conformational heterogeneity</li>
            <li>Preferred orientation; rare views are scarce</li>
            <li>The "ground truth" is a human judgement</li>
          </ul>
          <div style={{ marginTop: 18 }}>
            <ParticleLegend items={["matched", "model_only", "expert_only", "rejected"].filter((_, i) => step >= i) as never} />
          </div>
          <div className="callout stepfade" style={{ opacity: step >= 3 ? 1 : 0, marginTop: 18 }}>
            Topaz score threshold = <b>{overlayCounts.threshold.toFixed(1)}</b> (chosen by us, best F1). Over all 12 micrographs:
            {" "}{(b.tp).toLocaleString("en-US")} agreed · {b.fp.toLocaleString("en-US")} model-only · {b.fn.toLocaleString("en-US")} expert-only.
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}

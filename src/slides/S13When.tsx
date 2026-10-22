import { SlideFrame } from "../components/SlideFrame";
import { useStep } from "../lib/useStep";

const USE = [
  ["Large SPA dataset, few annotations", "Topaz (PU learning)"],
  ["Screening during collection", "crYOLO general model, on the fly"],
  ["Low-contrast, small or irregular particles", "learned picker + 2D-class cleanup"],
  ["Crowded tomograms; known or related complexes", "TomoTwin (reference or clustering)"],
  ["Reproducible high-throughput pipelines", "fixed model + logged thresholds"],
  ["Human picking becomes inconsistent", "model as a consistent first pass"],
];
const SIMPLE = [
  ["Large, obvious, well-separated particles", "blob / template picking is enough"],
  ["You need a strictly unbiased search", "independent methods, compare sets"],
  ["Data unlike any training set", "retrain, or don't trust the scores"],
  ["Interpretation hinges on weak density", "unfiltered half maps, not enhanced maps"],
];
export function S13When() {
  const { ref, step } = useStep<HTMLDivElement>(1);
  return (
    <SlideFrame id="s13">
      <div ref={ref}>
        <h2>When are these tools useful?</h2>
        <div className="grid2" style={{ gap: 44 }}>
          <div className="card acc stepfade" style={{ opacity: step >= 0 ? 1 : 0.1 }}>
            <h3 style={{ color: "var(--accept)", fontSize: 36 }}>● Reach for deep learning when…</h3>
            <table><tbody>{USE.map(([a, b]) => <tr key={a}><td style={{ fontSize: 31, padding: "14px 10px" }}>{a}</td><td className="muted" style={{ fontSize: 25, padding: "14px 10px" }}>{b}</td></tr>)}</tbody></table>
          </div>
          <div className="card unc stepfade" style={{ opacity: step >= 1 ? 1 : 0.1 }}>
            <h3 style={{ color: "var(--uncertain)", fontSize: 36 }}>◇ Prefer simpler or conventional methods when…</h3>
            <table><tbody>{SIMPLE.map(([a, b]) => <tr key={a}><td style={{ fontSize: 31, padding: "14px 10px" }}>{a}</td><td className="muted" style={{ fontSize: 25, padding: "14px 10px" }}>{b}</td></tr>)}</tbody></table>
          </div>
        </div>
        <p className="tiny muted" style={{ marginTop: 18 }}>Presenter's synthesis of the use cases stated in each method paper — not a published decision tree.</p>
      </div>
    </SlideFrame>
  );
}

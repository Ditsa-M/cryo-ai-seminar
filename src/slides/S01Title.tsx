import { SlideFrame } from "../components/SlideFrame";
import { Micrograph, ParticleLegend } from "../components/Micrograph";
import { useStep } from "../lib/useStep";
import { Video } from "../components/Video";
import { story } from "../lib/story";

export function S01Title() {
  const { ref, step } = useStep<HTMLDivElement>(4);
  // step -1: opening poster · 0: opening plays (pre-roll, holds on title) · 1: micrograph · 2: low-pass · 3: picks · 4: question
  return (
    <SlideFrame id="s01" className="title-slide">
      <div ref={ref} className="row" style={{ gap: 56, marginTop: 10 }}>
        <div className="col" style={{ paddingTop: 40 }}>
          <div className="kicker">BCH 561 · Biochemical technique seminar</div>
          <h1 style={{ fontSize: 92, fontWeight: 800, fontStretch: "82%", lineHeight: 0.98 }}>AI in cryo-EM<br />and cryo-ET<br />data processing</h1>
          <p className="muted" style={{ fontSize: 28, marginTop: 26 }}>{story.meta.presenter} · {story.meta.course} · {story.meta.date}</p>
          <div data-hand="question" className="callout stepfade" style={{ opacity: step >= 4 ? 1 : 0, fontSize: 34, marginTop: 40, lineHeight: 1.28, maxWidth: 820 }}>
            Where does deep learning add <b>trustworthy</b> structural information — and how can we tell whether an apparent improvement is <b>real</b>?
          </div>
        </div>
        <div style={{ width: 840 }}>
          <Micrograph size={840} filtered={step >= 2 ? 1 : 0} show={step >= 3 ? ["matched", "model_only", "expert_only"] : []} />
          <div className="stepfade" style={{ opacity: step >= 3 ? 1 : 0, marginTop: 10 }}>
            <ParticleLegend items={["matched", "model_only", "expert_only"]} />
          </div>
        </div>
      </div>
      <div className="stepfade" style={{ position: "absolute", inset: 0, zIndex: 10, background: "#04080B", opacity: step >= 1 ? 0 : 1, pointerEvents: "none" }}>
        <Video name="opening" kind="once" play={step >= 0} width={1920} startPoster alt="Opening: EMD-72202 density emerges from noise, then the PDB 9Q3L model of the beta2-adrenergic receptor dimer rotates, title appears" />
      </div>
    </SlideFrame>
  );
}

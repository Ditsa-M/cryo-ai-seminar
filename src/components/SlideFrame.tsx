import type { ReactNode } from "react";
import { Slide } from "@revealjs/react";
import { Hand } from "./Hand";
import { getSlide, endTime, fmtTime, words, type ProvLabel, type Stage } from "../lib/story";

const STAGES: { key: Exclude<Stage, null>; label: string }[] = [
  { key: "motion", label: "Motion" }, { key: "pick", label: "Pick" }, { key: "align", label: "Align" },
  { key: "reconstruct", label: "Reconstruct" }, { key: "enhance", label: "Enhance" }, { key: "interpret", label: "Interpret" },
];

export function WorkflowIndicator({ active }: { active: Stage }) {
  return (
    <div className="wf" aria-label={`Workflow stage: ${active ?? "overview"}`}>
      {STAGES.map((s, i) => (
        <span key={s.key} style={{ display: "contents" }}>
          {i > 0 && <span className="ar" aria-hidden>→</span>}
          <span className={"st" + (s.key === active ? " on" : "")}>{s.label}</span>
        </span>
      ))}
    </div>
  );
}

const CHIP: Record<ProvLabel, string> = {
  "EXPERIMENTAL DATA": "exp", "RECOMPUTED RESULT": "rec", "REPORTED RESULT": "rep", SIMULATION: "sim", "CONCEPTUAL SCHEMATIC": "sch",
};
export function Chips({ labels }: { labels: ProvLabel[] }) {
  if (!labels.length) return null;
  return <div className="chips">{labels.map((l) => <span key={l} className={"chip " + CHIP[l]}>{l}</span>)}</div>;
}

/** Fragment markers that drive useStep(); invisible, one per click cue. */
export function Markers({ n }: { n: number }) {
  return <>{Array.from({ length: n }, (_, i) => <span key={i} className="fragment marker" data-fragment-index={i} aria-hidden />)}</>;
}

/** reveal.js speaker notes (data-notes, shown pre-wrap), generated from story.yaml so script, timing and Q&A have one source. */
function notesText(id: string): string {
  const s = getSlide(id);
  const clicks = s.clicks.map((c, i) => `CLICK ${i + 1}: ${c}`).join("\n");
  const text = [
    `TARGET TIME: ${fmtTime(s.target_seconds)} (${s.target_seconds} s) — be done by ${fmtTime(endTime(id))}`,
    `WORD COUNT: ${words(s.script)}`,
    `SCRIPT: ${s.script}`,
    clicks,
    `SOURCE: ${s.source}`,
    `ESSENTIAL QUALIFICATION: ${s.qualification}`,
    `OPTIONAL DEEPER EXPLANATION: ${s.deeper}`,
    `LIKELY QUESTION: ${s.question}`,
    `SUGGESTED ANSWER: ${s.answer}`,
  ].join("\n\n");
  return text;
}

export function SlideFrame({ id, children, className, steps, hideChrome }: {
  id: string; children: ReactNode; className?: string; steps?: number; hideChrome?: boolean;
}) {
  const s = getSlide(id);
  const nSteps = steps ?? s.clicks.length;
  return (
    <Slide data-story-id={id} data-timing={s.target_seconds} notes={notesText(id)} className={className} aria-label={s.title}>
      {!hideChrome && <WorkflowIndicator active={s.stage} />}
      {!hideChrome && <Chips labels={s.labels} />}
      {children}
      <Markers n={nSteps} />
      <Hand id={id} steps={nSteps} />
      {s.evidence && s.citation && <div className="cite">{s.citation}</div>}
    </Slide>
  );
}

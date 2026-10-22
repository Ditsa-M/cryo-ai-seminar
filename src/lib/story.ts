import storyRaw from "../data/story.yaml";
import claimsRaw from "../data/claims.yaml";

export type Stage = "motion" | "pick" | "align" | "reconstruct" | "enhance" | "interpret" | null;
export type ProvLabel = "EXPERIMENTAL DATA" | "RECOMPUTED RESULT" | "REPORTED RESULT" | "SIMULATION" | "CONCEPTUAL SCHEMATIC";

export interface SlideSpec {
  id: string;
  title: string;
  stage: Stage;
  target_seconds: number;
  evidence: boolean;
  labels: ProvLabel[];
  citation: string;
  claims: string[];
  script: string;
  clicks: string[];
  source: string;
  qualification: string;
  deeper: string;
  question: string;
  answer: string;
}
export interface Story {
  meta: { title: string; subtitle: string; presenter: string; course: string; date: string; total_seconds: number };
  slides: SlideSpec[];
}
export interface Claim { id: string; slide: string; type: string; text: string; source: string; locator: string; status: string; note?: string }

export const story = storyRaw as Story;
export const claims = (claimsRaw as { claims: Claim[] }).claims;

export function getSlide(id: string): SlideSpec {
  const s = story.slides.find((x) => x.id === id);
  if (!s) throw new Error(`story.yaml has no slide ${id}`);
  return s;
}

export const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** cumulative end time (s) of a slide, for the "should be at" cue in the notes */
export function endTime(id: string): number {
  let t = 0;
  for (const s of story.slides) { t += s.target_seconds; if (s.id === id) return t; }
  return t;
}

import { Deck } from "@revealjs/react";
import RevealNotes from "reveal.js/plugin/notes";
import "reveal.js/reset.css";
import "reveal.js/reveal.css";
import "../styles/theme.css";
import { toggleReduced, isReduced } from "../lib/reducedMotion";
import { story } from "../lib/story";
import { S01Title } from "../slides/S01Title";
import { S02Why } from "../slides/S02Why";
import { S03Modes } from "../slides/S03Modes";
import { S04Principle } from "../slides/S04Principle";
import { S05RawData } from "../slides/S05RawData";
import { S06Workflow } from "../slides/S06Workflow";
import { S07Motion } from "../slides/S07Motion";
import { S08Picking } from "../slides/S08Picking";
import { S09Tools } from "../slides/S09Tools";
import { S10Interpret } from "../slides/S10Interpret";
import { S11Enhance } from "../slides/S11Enhance";
import { S12Benchmark } from "../slides/S12Benchmark";
import { S13When } from "../slides/S13When";
import { S14Limits } from "../slides/S14Limits";
import { S15TakeHome } from "../slides/S15TakeHome";
import { S16Refs } from "../slides/S16Refs";

// reveal.js normally lets URL query parameters override config (the speaker view relies on this:
// its preview iframes load ?receiver&postMessageEvents=true&controls=false...). Our React config
// prop would otherwise mask them, so merge them back in.
function queryConfig(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  new URLSearchParams(window.location.search).forEach((v, k) => {
    if (k === "print-pdf" || k === "reduced-motion") return;
    out[k] = v === "" || v === "true" ? true : v === "false" ? false : /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v;
  });
  return out;
}

export function Presentation() {
  return (
    <Deck
      plugins={[RevealNotes]}
      config={{
        width: 1920, height: 1080, margin: 0, minScale: 0.2, maxScale: 2,
        hash: true, controls: true, controlsTutorial: false, progress: true, slideNumber: "c/t",
        transition: "fade", transitionSpeed: "fast", backgroundTransition: "none",
        autoSlide: 0, autoSlideStoppable: true, loop: false, center: false,
        viewDistance: 2, mobileViewDistance: 2, preloadIframes: false,
        pdfSeparateFragments: false, pdfMaxPagesPerSlide: 1, showNotes: false,
        keyboard: { 77: () => toggleReduced() },  // M: reduced-motion toggle
        // speaker-view pacing: per-slide data-timing from story.yaml; totalTime is read by the notes plugin
        ...({ totalTime: story.meta.total_seconds } as object),
        ...queryConfig(),
      }}
      onReady={(deck) => {
        document.documentElement.classList.toggle("reduced-motion", isReduced());
        (window as unknown as { __deck: unknown }).__deck = deck;   // used by tests/export scripts
      }}
    >
      <S01Title /><S02Why /><S03Modes /><S04Principle /><S05RawData /><S06Workflow /><S07Motion /><S08Picking />
      <S09Tools /><S10Interpret /><S11Enhance /><S12Benchmark /><S13When /><S14Limits /><S15TakeHome /><S16Refs />
    </Deck>
  );
}

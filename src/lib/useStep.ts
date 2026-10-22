import { useEffect, useRef, useState } from "react";
import { useReveal } from "@revealjs/react";

export const isPrint = () => typeof window !== "undefined" && /print-pdf/.test(window.location.search);

/**
 * Current fragment step of the slide that contains `ref`, driven ONLY by reveal.js fragment
 * state (presenter clicks). -1 = no fragment shown. Going back hides the fragment and lowers the
 * step, so every animation is replayable and never resets on its own. In print-pdf mode the
 * final step is returned so the PDF shows the completed state.
 */
export function useStep<T extends HTMLElement>(maxStep: number) {
  const ref = useRef<T | null>(null);
  const deck = useReveal();
  const [step, setStep] = useState(isPrint() ? maxStep : -1);
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!deck || isPrint()) return;
    const update = () => {
      const section = ref.current?.closest("section");
      if (!section) return;
      const cur = deck.getCurrentSlide();
      setActive(cur === section);
      const shown = section.querySelectorAll(".fragment.visible").length;
      setStep(shown - 1);
    };
    update();
    const evs = ["slidechanged", "fragmentshown", "fragmenthidden", "ready", "overviewhidden"] as const;
    evs.forEach((e) => deck.on(e, update));
    return () => evs.forEach((e) => deck.off(e, update));
  }, [deck]);
  return { ref, step, active };
}

/** Is the slide containing `ref` the current slide (or the next one, for preloading)? */
export function useSlideProximity<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const deck = useReveal();
  const [state, setState] = useState<{ current: boolean; near: boolean }>({ current: isPrint(), near: isPrint() });
  useEffect(() => {
    if (!deck) return;
    const update = () => {
      const section = ref.current?.closest("section");
      if (!section) return;
      const slides = deck.getSlides();
      const idx = slides.indexOf(section as HTMLElement);
      const cur = deck.getIndices().h;
      setState({ current: idx === cur, near: idx === cur || idx === cur + 1 });
    };
    update();
    deck.on("slidechanged", update); deck.on("ready", update);
    return () => { deck.off("slidechanged", update); deck.off("ready", update); };
  }, [deck]);
  return { ref, ...state };
}

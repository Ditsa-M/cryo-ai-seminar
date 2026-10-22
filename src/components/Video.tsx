import { useEffect, useRef } from "react";
import { useSlideProximity, isPrint } from "../lib/useStep";
import { useReducedMotion } from "../lib/reducedMotion";

const base = import.meta.env.BASE_URL;

/**
 * Muted video with WebM/VP9 + MP4/H.264 sources and a poster.
 *  - kind="loop": decorative; plays only while its slide is current, loops seamlessly.
 *  - kind="once": scientific cause-and-effect; starts when `play` becomes true (a presenter click),
 *    plays once and holds the final frame; resets only when `play` goes false (presenter goes back).
 * Only the current and next slide preload. Reduced motion shows the poster (final/representative frame).
 */
export function Video({ name, kind, play = true, className, alt, width, height }: {
  name: string; kind: "loop" | "once"; play?: boolean; className?: string; alt: string; width?: number | string; height?: number;
}) {
  const { ref: wrap, current, near } = useSlideProximity<HTMLDivElement>();
  const v = useRef<HTMLVideoElement | null>(null);
  const reduced = useReducedMotion();
  const poster = `${base}posters/${name}.webp`;
  useEffect(() => {
    const el = v.current; if (!el) return;
    if (!current || reduced || isPrint()) { el.pause(); if (!current && kind === "once") el.currentTime = 0; return; }
    if (kind === "loop") { el.play().catch(() => {}); return; }
    if (play) { if (el.ended || el.currentTime === 0) { el.currentTime = 0; } el.play().catch(() => {}); }
    else { el.pause(); el.currentTime = 0; }
  }, [current, play, reduced, kind]);
  // in print / reduced motion, show the poster still
  const still = reduced || isPrint();
  return (
    <div ref={wrap} className={className} style={{ width }}>
      {still ? (
        <img src={poster} alt={alt} style={height ? { height, display: "block" } : { width: "100%" }} />
      ) : (
        <video ref={v} muted playsInline loop={kind === "loop"} preload={near ? "auto" : "none"} poster={poster}
          aria-label={alt} style={height ? { height, display: "block" } : { width: "100%", display: "block" }} disablePictureInPicture>
          <source src={`${base}video/${name}.webm`} type="video/webm; codecs=vp9" />
          <source src={`${base}video/${name}.mp4`} type="video/mp4" />
        </video>
      )}
    </div>
  );
}

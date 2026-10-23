import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";

// Opening scene (slide 1, presenter-started pre-roll). The molecule footage is a ChimeraX render of
// real deposited data (opening.cxc): EMD-72202 half-map average, then PDB 9Q3L. This composition only
// adds text: provenance labels per phase and the title. Plays once and holds the final frame.
const fade = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const Label = ({ f, from, to, children }: { f: number; from: number; to: number; children: React.ReactNode }) => (
  <div style={{ position: "absolute", left: 80, bottom: 70, fontFamily: "JetBrains Mono, monospace", fontSize: 26, letterSpacing: 2, color: "#C3D0D9",
    opacity: fade(f, from, from + 15) * (1 - fade(f, to - 15, to)) }}>{children}</div>
);
export const Opening = () => {
  const f = useCurrentFrame();
  const t = fade(f, 250, 300), s = fade(f, 290, 340);
  return (
    <AbsoluteFill style={{ background: "#04080B" /* = encoded background of the ChimeraX clip, so the scaled clip has no visible edge */ }}>
      <OffthreadVideo src={staticFile("opening_raw.mp4")} muted style={{ width: 1920, height: 1080, transformOrigin: "50% 50%", mixBlendMode: "lighten" /* background pixels → page colour, no visible clip edge */,
        transform: `translateX(${interpolate(t, [0, 1], [0, 470])}px) scale(${interpolate(t, [0, 1], [1, 0.72])})` }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 190, background: "linear-gradient(to top, rgba(5,8,12,.92), rgba(5,8,12,0))" }} />
      <Label f={f} from={5} to={95}>● EXPERIMENTAL DATA · EMD-72202 half maps · contour rising out of the noise</Label>
      <Label f={f} from={95} to={190}>● EMD-72202 density  +  ◆ deposited atomic model PDB 9Q3L</Label>
      <Label f={f} from={190} to={260}>β2-adrenergic receptor dimer · AP-7-168 (amber) · agonist (white)</Label>
      <div style={{ position: "absolute", left: 110, top: 300, width: 860, opacity: t, transform: `translateY(${interpolate(t, [0, 1], [24, 0])}px)` }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 26, letterSpacing: 4, color: "#4FD1E8", marginBottom: 22 }}>BCH 561 · BIOCHEMICAL TECHNIQUE SEMINAR</div>
        <div style={{ fontFamily: "Archivo, Arial Narrow, sans-serif", fontWeight: 800, fontSize: 108, lineHeight: 0.98, color: "#F4F7F9", letterSpacing: -2 }}>AI in cryo-EM<br />and cryo-ET</div>
        <div style={{ fontFamily: "Archivo, Arial, sans-serif", fontSize: 38, color: "#C3D0D9", marginTop: 26, lineHeight: 1.3, opacity: s }}>
          From noisy measurements to structures —<br />and how to tell when the model is uncertain.
        </div>
      </div>
      <div style={{ position: "absolute", right: 80, bottom: 70, fontFamily: "JetBrains Mono, monospace", fontSize: 24, color: "#8EA2B1", opacity: s }}>Ditsa Mallick · ASU · 27 Oct 2026</div>
    </AbsoluteFill>
  );
};

import { AbsoluteFill, Img, Loop, OffthreadVideo, Sequence, staticFile } from "remotion";

// Silent MP4 backup assembled from per-click screenshots of the live deck (scripts/export-mp4.mjs).
// Each segment holds one click state for its share of the slide's scripted time. Where the live deck
// shows a video, the real clip is overlaid at its on-screen rectangle: decorative loops loop; the
// scientific 'once' clip plays once from its click and then holds its final frame (the poster).
export interface Segment { img: string; frames: number }
export interface Overlay { src: string; poster: string; from: number; frames: number; clipFrames: number; x: number; y: number; w: number; h: number; loop: boolean }
export interface BackupProps { segments: Segment[]; overlays?: Overlay[] }
export const DeckBackup = ({ segments, overlays = [] }: BackupProps) => {
  let from = 0;
  const box = (o: Overlay) => ({ position: "absolute" as const, left: o.x, top: o.y, width: o.w, height: o.h });
  return (
    <AbsoluteFill style={{ background: "#0B1620" }}>
      {segments.map((s, i) => {
        const el = <Sequence key={i} from={from} durationInFrames={s.frames}><Img src={staticFile(s.img)} style={{ width: 1920, height: 1080 }} /></Sequence>;
        from += s.frames; return el;
      })}
      {overlays.map((o, i) => (
        <Sequence key={"o" + i} from={o.from} durationInFrames={o.frames}>
          {o.loop ? (
            <Loop durationInFrames={o.clipFrames}><OffthreadVideo src={staticFile(o.src)} muted style={box(o)} /></Loop>
          ) : (
            <>
              <Sequence durationInFrames={Math.min(o.clipFrames, o.frames)}><OffthreadVideo src={staticFile(o.src)} muted style={box(o)} /></Sequence>
              {o.frames > o.clipFrames && <Sequence from={o.clipFrames}><Img src={staticFile(o.poster)} style={box(o)} /></Sequence>}
            </>
          )}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

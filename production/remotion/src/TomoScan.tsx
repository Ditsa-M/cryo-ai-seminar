import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Decorative 8 s seamless loop: a TomoTwin-style 37-voxel search box (~370 A at 10 A/px; 46 px at
// this simulation's 8 A/px) glides over a SIMULATED tomogram slab. Smooth closed (Lissajous) path,
// so frame 0 == frame N. No causal events.
export const TomoScan = () => {
  const f = useCurrentFrame(); const { durationInFrames, width } = useVideoConfig();
  const t = (f / durationInFrames) * 2 * Math.PI;
  const box = (46 / 256) * width;
  const cx = width / 2 + Math.sin(t) * width * 0.3, cy = width / 2 + Math.sin(2 * t) * width * 0.22;
  return (
    <AbsoluteFill style={{ background: "#0B1620" }}>
      <Img src={staticFile("s03_tomo_xy.webp")} style={{ width, height: width }} />
      <svg width={width} height={width} style={{ position: "absolute", inset: 0 }}>
        <rect x={cx - box / 2} y={cy - box / 2} width={box} height={box} fill="rgba(168,139,250,.12)" stroke="#A88BFA" strokeWidth={4} />
        <rect x={cx - box / 2 + 9} y={cy - box / 2 - 9} width={box} height={box} fill="none" stroke="#A88BFA" strokeWidth={2} opacity={0.6} />
        <text x={18} y={width - 18} fill="#D9C2FF" fontSize={24} fontFamily="JetBrains Mono, monospace">SIMULATION · schematic 37³ box</text>
      </svg>
    </AbsoluteFill>
  );
};

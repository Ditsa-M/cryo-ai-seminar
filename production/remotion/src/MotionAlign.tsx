import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

// Real EMPIAR-10204 data (export_motion_frames.py): 7 groups of 7 gain-corrected frames, 1.77 A/px,
// low-pass ~8 A. Phase A (0-4.2 s): flip through the groups with a FIXED reticle so the drift is
// visible. Phase B (4.5-8.5 s): cumulative sums build up, unaligned (left) vs aligned (right).
// Phase C: hold on the final frame. Plays once; the deck holds the last frame.
const CROP = { x: 104, y: 14, s: 300 }; // 512x512 export; centred on the darkest feature of the aligned sum
const D = 560;                          // display size per panel
const ret = { x: 255, y: 160 };         // feature position in group 1 (export px), found automatically
const Panel = ({ src, label, color, reticle }: { src: string; label: string; color: string; reticle?: boolean }) => (
  <div style={{ width: D }}>
    <div style={{ width: D, height: D, overflow: "hidden", position: "relative", border: `3px solid ${color}` }}>
      <Img src={staticFile(src)} style={{ position: "absolute", left: (-CROP.x * D) / CROP.s, top: (-CROP.y * D) / CROP.s, width: (512 * D) / CROP.s, height: (512 * D) / CROP.s, imageRendering: "auto" }} />
      {reticle && (
        <svg width={D} height={D} style={{ position: "absolute", inset: 0 }}>
          <circle cx={((ret.x - CROP.x) * D) / CROP.s} cy={((ret.y - CROP.y) * D) / CROP.s} r={26} fill="none" stroke="#F2B347" strokeWidth={3} strokeDasharray="7 5" />
          <line x1={((ret.x - CROP.x) * D) / CROP.s - 40} x2={((ret.x - CROP.x) * D) / CROP.s + 40} y1={((ret.y - CROP.y) * D) / CROP.s} y2={((ret.y - CROP.y) * D) / CROP.s} stroke="#F2B347" strokeWidth={1.5} />
          <line y1={((ret.y - CROP.y) * D) / CROP.s - 40} y2={((ret.y - CROP.y) * D) / CROP.s + 40} x1={((ret.x - CROP.x) * D) / CROP.s} x2={((ret.x - CROP.x) * D) / CROP.s} stroke="#F2B347" strokeWidth={1.5} />
        </svg>
      )}
    </div>
    <div style={{ color: "#EEF3F6", fontFamily: "Archivo, Arial", fontSize: 28, fontWeight: 600, marginTop: 10 }}>{label}</div>
  </div>
);
export const MotionAlign = () => {
  const f = useCurrentFrame();
  const g = Math.min(6, Math.floor(f / 18));                          // phase A: 18 frames per group
  const k = Math.min(6, Math.max(0, Math.floor((f - 135) / 17)));     // phase B: groups accumulate
  const showB = interpolate(f, [126, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#0B1620", padding: 40, flexDirection: "row", gap: 40 }}>
      {showB < 1 && (
        <div style={{ opacity: 1 - showB, position: "absolute", left: 40, top: 40, display: "flex", gap: 40 }}>
          <Panel src={`motion/group_raw_${g}.png`} label={`Frames ${g * 7 + 1}–${g * 7 + 7} (group ${g + 1}/7)`} color="#5A6E7D" reticle />
          <div style={{ color: "#C3D0D9", fontFamily: "Archivo, Arial", fontSize: 30, width: 560, paddingTop: 140, lineHeight: 1.35 }}>
            The reticle is fixed on a feature in frames 1–7.<br />It drifts ≈13 Å (≈7 px here) by frames 43–49 — small per group, but it blurs the sum.
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 20, color: "#8EA2B1", marginTop: 30 }}>EXPERIMENTAL DATA · EMPIAR-10204</div>
          </div>
        </div>
      )}
      <div style={{ opacity: showB, position: "absolute", left: 40, top: 40, display: "flex", gap: 40 }}>
        <Panel src={`motion/cum_unaligned_${k}.png`} label={`Sum of ${(k + 1) * 7} frames — unaligned`} color="#E8559A" />
        <Panel src={`motion/cum_aligned_${k}.png`} label={`Sum of ${(k + 1) * 7} frames — aligned`} color="#4FD1E8" />
      </div>
    </AbsoluteFill>
  );
};

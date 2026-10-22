import { SlideFrame } from "../components/SlideFrame";
import { Video } from "../components/Video";
import { useStep } from "../lib/useStep";

const base = import.meta.env.BASE_URL;
export function S03Modes() {
  const { ref, step } = useStep<HTMLDivElement>(1);
  const rows = [
    ["Sample", "purified complex, thin ice", "cells, lamellae, organelles"],
    ["Measured", "2D projections, one per particle", "tilt series of one region (≈ ±60°)"],
    ["Pick", "2D particle coordinates", "3D subtomogram coordinates"],
    ["Average", "single-particle reconstruction", "subtomogram averaging"],
    ["Typical result", "often near-atomic", "lower resolution, native context"],
  ];
  return (
    <SlideFrame id="s03">
      <div ref={ref}>
        <h2>Two branches: single particles vs. tomography</h2>
        <div className="grid2" style={{ gap: 48 }}>
          <div>
            <p className="panel-label">Single-particle analysis · EXPERIMENTAL (EMPIAR-10017)</p>
            <img src={`${base}figures/s01_mic_lp.webp`} alt="Purified beta-galactosidase particles in ice" style={{ width: "100%", height: 340, objectFit: "cover" }} />
          </div>
          <div className="stepfade" style={{ opacity: step >= 0 ? 1 : 0, transform: step >= 0 ? "none" : "translateX(40px)" }}>
            <p className="panel-label">Cryo-ET · SIMULATION (PDB 6CVM + 4V6X, ±60° tilt, membrane slab)</p>
            <Video name="tomo-scan" kind="loop" height={340} alt="Simulated tomogram slab with a 3D search box scanning (decorative loop)" />
          </div>
        </div>
        <table style={{ marginTop: 22 }}>
          <thead><tr><th style={{ width: "18%" }}></th><th>Single-particle analysis (SPA)</th><th>Cryo-electron tomography (cryo-ET)</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r[0]}><td className="muted">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody>
        </table>
        <div className="grid2 stepfade" style={{ gap: 48, marginTop: 16, opacity: step >= 1 ? 1 : 0 }}>
          <div className="callout cyan">What is the <b>atomic mechanism</b> of this purified complex?</div>
          <div className="callout">Where is it, what is it bound to, what <b>state</b> is it in — inside the cell?</div>
        </div>
      </div>
    </SlideFrame>
  );
}

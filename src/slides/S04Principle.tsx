import { SlideFrame } from "../components/SlideFrame";
import { Tex } from "../components/Tex";
import { Video } from "../components/Video";
import { LineChart } from "../components/LineChart";
import { useStep } from "../lib/useStep";
import ctf from "../data/generated/s04_ctf.json";

const base = import.meta.env.BASE_URL;
const ROWS = [
  { step: 0, img: "s04_clean", label: "1 · Projection", note: "random orientations φ, summed along the beam" },
  { step: 1, img: "s04_ctfd", label: "2 · × CTF", note: "defocus-dependent contrast flips and zeros" },
  { step: 2, img: "s04_noisy", label: "3 · + noise n", note: "SNR 0.05 — noise ≫ signal at a safe dose" },
  { step: 3, img: "s04_avgs", label: "4 · Average N aligned copies", note: `N = ${ctf.avgn.join(", ")}` },
  { step: 4, img: "s04_recs", label: "5 · Many views → 3D", note: `central slice from ${ctf.recn.map((n) => n.toLocaleString("en-US")).join(" / ")} views, then truth` },
];
export function S04Principle() {
  const { ref, step } = useStep<HTMLDivElement>(4);
  return (
    <SlideFrame id="s04">
      <div ref={ref}>
        <h2>Image formation: one equation, three unknowns</h2>
        <div className="row" style={{ gap: 40 }}>
          <div style={{ width: 640 }}>
            <div className="eq"><Tex display>{String.raw`y_i \;=\; \mathrm{CTF}_i \ast \mathcal{P}_{\phi_i}\, V \;+\; n_i`}</Tex></div>
            <table className="small" style={{ fontSize: 21 }}>
              <tbody>
                <tr><td><Tex>{"y_i"}</Tex></td><td>particle image <i>i</i> (measured)</td></tr>
                <tr><td><Tex>{"V"}</Tex></td><td>3D density of the molecule (unknown)</td></tr>
                <tr><td><Tex>{String.raw`\phi_i`}</Tex></td><td>its orientation and position (unknown)</td></tr>
                <tr><td><Tex>{String.raw`\mathcal{P}`}</Tex></td><td>projection along the beam</td></tr>
                <tr><td><Tex>{String.raw`\mathrm{CTF}_i`}</Tex></td><td>microscope contrast transfer (estimated)</td></tr>
                <tr><td><Tex>{"n_i"}</Tex></td><td>shot noise (unknown, large)</td></tr>
              </tbody>
            </table>
            <div className="stepfade" style={{ opacity: step >= 1 ? 1 : 0.0, marginTop: 8 }}>
              <LineChart w={640} h={230} xLabel="spatial frequency (1/Å)" yLabel="CTF" xDomain={[0, 0.25]} yDomain={[-1, 1]} yTicks={[-1, 0, 1]} xTicks={[0, 0.05, 0.1, 0.15, 0.2, 0.25]}
                series={[{ key: "ctf", label: "CTF", x: ctf.k, y: ctf.ctf, color: "#4FD1E8" }]} />
              <p className="figcap">{ctf.kv} kV, C<sub>s</sub> {ctf.cs_mm} mm, defocus {ctf.defocus_um} µm. Varying defocus moves the zeros.</p>
            </div>
          </div>
          <div className="col">
            {ROWS.map((r) => (
              <div key={r.img} className="stepfade" style={{ opacity: step >= r.step ? 1 : 0.08, display: "flex", gap: 18, alignItems: "center", marginBottom: 10 }}>
                <div style={{ width: 300 }}>
                  <div style={{ fontWeight: 700, fontSize: 24 }}>{r.label}</div>
                  <div className="tiny muted">{r.note}</div>
                </div>
                <img src={`${base}figures/${r.img}.webp`} alt={r.label} style={{ height: 134 }} />
              </div>
            ))}
          </div>
          <div style={{ width: 200, position: "absolute", right: 64, top: 150 }}>
            <Video name="bgal-spin" kind="loop" alt="Rotating beta-galactosidase density simulated from PDB 6CVM (decorative loop)" />
            <p className="figcap" style={{ textAlign: "center" }}>V: β-galactosidase<br />(PDB 6CVM, simulated)</p>
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}

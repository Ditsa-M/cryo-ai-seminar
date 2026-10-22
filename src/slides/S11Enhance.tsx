import { SlideFrame } from "../components/SlideFrame";
import { LineChart } from "../components/LineChart";
import { useStep } from "../lib/useStep";
import fsc from "../data/generated/s11_fsc.json";
import lv from "../data/generated/s11_levels.json";

const base = import.meta.env.BASE_URL;
const MAPS = [
  { k: "unsharpened", t: "Unsharpened average of half maps", s: 0 },
  { k: "globalB", t: `Global B-factor sharpened (B = ${fsc.B} Å²)`, s: 1 },
  { k: "deepemhancer", t: "DeepEMhancer (tightTarget)", s: 2 },
];
export function S11Enhance() {
  const { ref, step } = useStep<HTMLDivElement>(4);
  const half = step >= 4;
  const pal = lv.palette as [number, string][];
  return (
    <SlideFrame id="s11">
      <div ref={ref}>
        <h2>Map enhancement: cleaner is not the same as more evidence</h2>
        <div className="grid3" style={{ gap: 22 }}>
          {MAPS.map((m) => (
            <div key={m.k} className="stepfade" style={{ opacity: step >= m.s ? 1 : 0.06 }}>
              <p className="panel-label">{m.t}</p>
              <div style={{ position: "relative", height: 380, background: "#0B1620" }}>
                <img src={`${base}figures/s11_${m.k}_overview.webp`} alt={`${m.t}, contoured at 80% atom inclusion`} className="stepfade" style={{ position: "absolute", inset: 0, height: 380, margin: "0 auto", opacity: half ? 0 : 1 }} />
                <img src={`${base}figures/s11_${m.k}_halflevel.webp`} alt={`${m.t} at half contour level`} className="stepfade" style={{ position: "absolute", inset: 0, height: 380, margin: "0 auto", opacity: half ? 1 : 0 }} />
              </div>
            </div>
          ))}
        </div>
        <p className="figcap">EMD-72202 (β2AR dimer, nanodisc). Each map contoured where 80% of PDB 9Q3L atoms lie inside{half ? <b style={{ color: "var(--uncertain)" }}> — now at HALF that level: the conventional maps show the lipid nanodisc; DeepEMhancer removed it.</b> : "."}</p>
        <div className="row stepfade" style={{ opacity: step >= 3 ? 1 : 0, gap: 30, marginTop: 6 }}>
          <div style={{ width: 640 }}>
            <LineChart w={640} h={260} xLabel="resolution (Å)" yLabel="half-map FSC" xDomain={[0, 0.45]} yDomain={[-0.05, 1]} yTicks={[0, 0.143, 0.5, 1]}
              xTicks={[1 / 20, 1 / 6, 1 / 4, 1 / 3, 1 / 2.5]} xFmt={(v) => (1 / v).toFixed(1)}
              refLines={[{ y: 0.143, label: "0.143" }]}
              series={[{ key: "m", label: "masked", x: fsc.freq, y: fsc.masked, color: "#4FD1E8" }, { key: "u", label: "unmasked", x: fsc.freq, y: fsc.unmasked, color: "#8EA2B1", dash: "6 5" }]} />
          </div>
          <div className="col">
            <div className="callout cyan" style={{ fontSize: 22 }}>
              <b>Independent evidence — unchanged by any post-processing:</b> gold-standard FSC<sub>0.143</sub> {fsc.res_masked} Å (soft mask; {fsc.res_unmasked} Å unmasked; deposited {fsc.author_res} Å).
              Local resolution {pal[0][0]}–{pal[pal.length - 1][0]} Å at the protein atoms, far worse in the nanodisc.
            </div>
            <div className="row" style={{ gap: 14, marginTop: 10, alignItems: "center" }}>
              <img src={`${base}figures/s11_locres_overview.webp`} alt="Unsharpened map coloured by local resolution" style={{ height: 150 }} />
              <div>
                <div style={{ display: "flex" }}>{pal.map(([v, c]) => <div key={v} style={{ width: 60, height: 20, background: c }} />)}</div>
                <div style={{ display: "flex", fontFamily: "var(--mono)", fontSize: 15 }}>{pal.map(([v]) => <div key={v} style={{ width: 60 }}>{v.toFixed(2)}</div>)}</div>
                <p className="tiny muted">local resolution (Å), viridis; bright = better</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}

import overlay from "../data/generated/s01_overlay.json";

const base = import.meta.env.BASE_URL;
type Cat = "matched" | "model_only" | "expert_only" | "rejected";

export function HatchDefs() {
  return (
    <defs>
      <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="7" stroke="#E8559A" strokeWidth="2.2" />
      </pattern>
      <pattern id="hatch2" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
        <line x1="0" y1="0" x2="0" y2="7" stroke="#E8559A" strokeWidth="2.2" />
      </pattern>
    </defs>
  );
}

/** Real EMPIAR-10017 crop with presenter-computed pick categories. Size in px; `filtered` 0..1 fades the low-pass image in. */
export function Micrograph({ size, filtered, show, dim }: { size: number; filtered: number; show: Cat[]; dim?: boolean }) {
  const r = overlay.radius_frac * size * 0.62;   // display radius ~ particle radius (smaller than match radius)
  const cls: Record<Cat, string> = { matched: "p-acc", model_only: "p-unc", expert_only: "p-mis", rejected: "p-rej" };
  const scalePx = (overlay.scale_bar_A / (overlay.apix * overlay.crop_px)) * size;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <img src={`${base}figures/s01_mic_raw.webp`} alt="Raw cryo-EM micrograph of beta-galactosidase (EMPIAR-10017)" style={{ position: "absolute", inset: 0, width: size, height: size, opacity: dim ? 0.55 : 1 }} />
      <img src={`${base}figures/s01_mic_lp.webp`} alt="Same micrograph after low-pass filtering" className="stepfade" style={{ position: "absolute", inset: 0, width: size, height: size, opacity: filtered * (dim ? 0.55 : 1) }} />
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ position: "absolute", inset: 0 }}>
        <HatchDefs />
        {(Object.keys(cls) as Cat[]).map((c) => (
          <g key={c} className="stepfade" style={{ opacity: show.includes(c) ? 1 : 0 }}>
            {(overlay[c] as number[][]).map(([x, y], i) =>
              c === "rejected"
                ? <rect key={i} x={x * size - r * 0.8} y={y * size - r * 0.8} width={r * 1.6} height={r * 1.6} className="p-rej" fillOpacity={0.5} />
                : <circle key={i} cx={x * size} cy={y * size} r={r} className={cls[c]} />)}
          </g>
        ))}
        <g transform={`translate(${size - scalePx - 24}, ${size - 28})`}>
          <rect x={-8} y={-26} width={scalePx + 16} height={38} fill="#0B1620" opacity={0.75} rx={3} />
          <line x1={0} x2={scalePx} y1={0} y2={0} stroke="#fff" strokeWidth={5} />
          <text x={scalePx / 2} y={-8} fill="#fff" fontSize={18} textAnchor="middle" fontFamily="JetBrains Mono">{overlay.scale_bar_A / 10} nm</text>
        </g>
      </svg>
    </div>
  );
}

export function ParticleLegend({ items }: { items: Cat[] }) {
  const sw = (c: Cat) => {
    if (c === "matched") return <circle cx={13} cy={13} r={10} className="p-acc" />;
    if (c === "model_only") return <circle cx={13} cy={13} r={10} className="p-unc" />;
    if (c === "expert_only") return <circle cx={13} cy={13} r={10} className="p-mis" />;
    return <rect x={3} y={3} width={20} height={20} className="p-rej" fillOpacity={0.5} />;
  };
  const label: Record<Cat, string> = {
    matched: "Accepted — model and expert agree (solid)",
    model_only: "Uncertain — model only (dashed)",
    expert_only: "Missed — expert only (dotted)",
    rejected: "Rejected — scored below threshold (hatched)",
  };
  return (
    <div className="legend">
      {items.map((c) => (
        <span key={c}><svg className="sw" width={26} height={26}><HatchDefs />{sw(c)}</svg>{label[c]}</span>
      ))}
    </div>
  );
}
export const overlayCounts = {
  matched: overlay.matched.length, model_only: overlay.model_only.length, expert_only: overlay.expert_only.length, threshold: overlay.threshold,
};

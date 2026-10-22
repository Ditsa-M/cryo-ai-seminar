import * as d3 from "d3";

export interface Series { key: string; label: string; x: number[]; y: number[]; color: string; dash?: string; width?: number }
/** Minimal SVG line chart (D3 scales/paths). One y-axis only. */
export function LineChart({ series, w, h, xLabel, yLabel, xDomain, yDomain, xTicks, yTicks, xFmt, refLines = [], children, margin }: {
  series: Series[]; w: number; h: number; xLabel: string; yLabel: string; xDomain: [number, number]; yDomain: [number, number];
  xTicks?: number[]; yTicks?: number[]; xFmt?: (v: number) => string; refLines?: { y?: number; x?: number; label: string; color?: string }[];
  children?: (sx: d3.ScaleLinear<number, number>, sy: d3.ScaleLinear<number, number>) => React.ReactNode;
  margin?: { l: number; r: number; t: number; b: number };
}) {
  const m = margin ?? { l: 78, r: 24, t: 16, b: 64 };
  const sx = d3.scaleLinear().domain(xDomain).range([m.l, w - m.r]);
  const sy = d3.scaleLinear().domain(yDomain).range([h - m.b, m.t]);
  const lo = Math.min(...xDomain), hi = Math.max(...xDomain);   // domain may be reversed
  const line = (s: Series) => d3.line<number>().x((_, i) => sx(s.x[i])).y((v) => sy(v)).defined((v, i) => Number.isFinite(v) && s.x[i] >= lo && s.x[i] <= hi)(s.y) ?? "";
  const xt = xTicks ?? sx.ticks(6), yt = yTicks ?? sy.ticks(5);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={`${yLabel} versus ${xLabel}`}>
      {yt.map((t) => <g key={"y" + t}><line x1={m.l} x2={w - m.r} y1={sy(t)} y2={sy(t)} stroke="#2A3D4C" strokeWidth={1} />
        <text x={m.l - 10} y={sy(t) + 6} fill="#8EA2B1" fontSize={18} textAnchor="end" fontFamily="JetBrains Mono">{t}</text></g>)}
      {xt.map((t) => <text key={"x" + t} x={sx(t)} y={h - m.b + 28} fill="#8EA2B1" fontSize={18} textAnchor="middle" fontFamily="JetBrains Mono">{xFmt ? xFmt(t) : t}</text>)}
      <line x1={m.l} x2={w - m.r} y1={h - m.b} y2={h - m.b} stroke="#8EA2B1" strokeWidth={1.5} />
      <text x={(m.l + w - m.r) / 2} y={h - 8} fill="#C3D0D9" fontSize={20} textAnchor="middle">{xLabel}</text>
      <text transform={`translate(20 ${(m.t + h - m.b) / 2}) rotate(-90)`} fill="#C3D0D9" fontSize={20} textAnchor="middle">{yLabel}</text>
      {refLines.map((r, i) => r.y !== undefined
        ? <g key={i}><line x1={m.l} x2={w - m.r} y1={sy(r.y)} y2={sy(r.y)} stroke={r.color ?? "#F2B347"} strokeDasharray="6 5" strokeWidth={2} />
            <text x={w - m.r - 4} y={sy(r.y) - 8} fill={r.color ?? "#F2B347"} fontSize={18} textAnchor="end" fontFamily="JetBrains Mono">{r.label}</text></g>
        : <g key={i}><line x1={sx(r.x!)} x2={sx(r.x!)} y1={m.t} y2={h - m.b} stroke={r.color ?? "#F2B347"} strokeDasharray="6 5" strokeWidth={2} />
            <text x={sx(r.x!) + 6} y={m.t + 18} fill={r.color ?? "#F2B347"} fontSize={18} fontFamily="JetBrains Mono">{r.label}</text></g>)}
      {series.map((s) => <path key={s.key} d={line(s)} fill="none" stroke={s.color} strokeWidth={s.width ?? 2.5} strokeDasharray={s.dash} />)}
      {children?.(sx, sy)}
    </svg>
  );
}

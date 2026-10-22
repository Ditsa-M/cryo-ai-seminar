/** Horizontal pipeline strip; `errorAt` marks where an error enters and `spread` how far it has propagated. */
const STEPS = ["Movie frames", "Motion corr.", "Micrograph", "Pick", "Align / classify", "Reconstruct", "Enhance", "Interpret"];
export function Pipeline({ errorAt = -1, spread = -1, width = 1780 }: { errorAt?: number; spread?: number; width?: number }) {
  const n = STEPS.length, gap = 14, w = (width - gap * (n - 1)) / n, h = 92;
  return (
    <svg viewBox={`0 0 ${width} ${h + 70}`} width={width} role="img" aria-label="Processing pipeline with error propagation">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#8EA2B1" /></marker>
      </defs>
      {STEPS.map((s, i) => {
        const x = i * (w + gap);
        const bad = errorAt >= 0 && i >= errorAt && i <= spread;
        return (
          <g key={s}>
            <rect x={x} y={10} width={w} height={h} rx={4} fill={bad ? "rgba(232,85,154,.16)" : "#14232F"} stroke={bad ? "#E8559A" : "#2A3D4C"} strokeWidth={bad ? 2.5 : 1.5} strokeDasharray={bad && i > errorAt ? "7 5" : undefined} className="stepfade" />
            <text x={x + w / 2} y={10 + h / 2 + 8} textAnchor="middle" fill="#EEF3F6" fontSize={24} fontFamily="Archivo" fontWeight={600}>{s}</text>
            {i < n - 1 && <line x1={x + w + 1} x2={x + w + gap - 1} y1={10 + h / 2} y2={10 + h / 2} stroke="#8EA2B1" strokeWidth={2} markerEnd="url(#arr)" />}
            {bad && i === errorAt && <text x={x + w / 2} y={h + 46} textAnchor="middle" fill="#E8559A" fontSize={22} fontFamily="JetBrains Mono">✕ error enters</text>}
            {bad && i === spread && i > errorAt && <text x={x + w / 2} y={h + 46} textAnchor="middle" fill="#E8559A" fontSize={22} fontFamily="JetBrains Mono">→ claim affected</text>}
          </g>
        );
      })}
    </svg>
  );
}

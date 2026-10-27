import { useReducedMotion } from "../lib/reducedMotion";

// Conceptual schematic of a cryo-EM column (not to scale): gun → condenser → specimen in ice →
// objective → direct detector. Electrons fall through the beam (SMIL, deterministic timings);
// flashes on the particles mark radiation damage; detector pixels light up as electrons are counted.
// Reduced motion renders the same drawing static.
const CX = 100, BEAM = [62, 138];
const ABOVE = [70, 84, 98, 112, 126, 77, 91, 105, 119, 133];       // x of electrons above the sample
const BELOW = [66, 82, 100, 116, 132, 74, 92, 108, 124];          // x of electrons reaching the detector
const PROTEINS = [[66, 231], [88, 228], [110, 232], [132, 229]];
const PIX = [[38, 0.1], [52, 0.9], [66, 0.4], [80, 1.3], [94, 0.2], [108, 1.0], [122, 0.6], [136, 1.5], [150, 0.3], [164, 1.1]];

export function Microscope({ width = 340 }: { width?: number }) {
  const still = useReducedMotion();
  const label = (y: number, t: string, sub?: string, color = "#C3D0D9") => (
    <g>
      <line x1={172} x2={186} y1={y - 5} y2={y - 5} stroke="#2A3D4C" strokeWidth={1.5} />
      <text x={192} y={y} fill={color} fontSize={17} fontFamily="Archivo">{t}</text>
      {sub && <text x={192} y={y + 19} fill="#8EA2B1" fontSize={14} fontFamily="JetBrains Mono">{sub}</text>}
    </g>
  );
  return (
    <svg viewBox="0 0 340 480" width={width} role="img" aria-label="Schematic of a cryo-electron microscope: an electron gun fires a beam through condenser lenses onto a frozen sample; electrons that pass through are focused by the objective lens and counted by a direct electron detector; some electrons break bonds in the sample.">
      {/* beam: cone from the gun to the condenser, parallel onto the sample, then focused onto the detector */}
      <path d={`M${CX - 4},46 L${BEAM[0]},112 L${BEAM[0]},222 L${BEAM[1]},222 L${BEAM[1]},112 L${CX + 4},46 Z`} fill="rgba(79,209,232,.10)" />
      <path d={`M${BEAM[0]},244 L${BEAM[0]},330 L${CX - 8},372 L38,420 L162,420 L${CX + 8},372 L${BEAM[1]},330 L${BEAM[1]},244 Z`} fill="rgba(79,209,232,.07)" />
      {/* gun */}
      <rect data-hand="gun" x={70} y={6} width={60} height={34} rx={5} fill="#1C2E3B" stroke="#8EA2B1" strokeWidth={1.5} />
      <path d={`M${CX - 8},40 L${CX},50 L${CX + 8},40 Z`} fill="#8EA2B1" />
      <circle cx={CX} cy={52} r={4} fill="#4FD1E8">{!still && <animate attributeName="opacity" values="1;.4;1" dur="0.9s" repeatCount="indefinite" />}</circle>
      {/* lenses */}
      <ellipse cx={CX} cy={112} rx={58} ry={9} fill="none" stroke="#8EA2B1" strokeWidth={2} />
      <ellipse cx={CX} cy={330} rx={58} ry={9} fill="none" stroke="#8EA2B1" strokeWidth={2} />
      {/* sample: thin ice across a grid hole, particles inside */}
      <rect x={24} y={222} width={14} height={22} fill="#5A6B78" />
      <rect x={162} y={222} width={14} height={22} fill="#5A6B78" />
      <rect data-hand="sample" x={38} y={224} width={124} height={18} fill="rgba(160,205,235,.20)" stroke="rgba(160,205,235,.5)" strokeWidth={1} />
      {PROTEINS.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={5.5} fill="#4FD1E8" />
          <circle cx={x + 5} cy={y + 3} r={3.5} fill="#4FD1E8" />
          {/* radiation damage: a bond breaks */}
          <g opacity={still ? (i === 1 ? 1 : 0) : 0}>
            <path d={`M${x - 9},${y - 9} l5,5 M${x + 11},${y - 9} l-5,5 M${x - 9},${y + 11} l5,-5 M${x + 13},${y + 11} l-5,-5`} stroke="#E8559A" strokeWidth={2.5} strokeLinecap="round" />
            {!still && <animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.55;0.65;1" dur={`${2.2 + i * 0.37}s`} begin={`${i * 0.6}s`} repeatCount="indefinite" />}
          </g>
        </g>
      ))}
      {/* electrons */}
      {ABOVE.map((x, i) => (
        <circle key={"a" + i} cx={x} cy={still ? 70 + ((i * 37) % 140) : 56} r={3} fill="#E0F9FD">
          {!still && <animate attributeName="cy" from="56" to="222" dur="1.2s" begin={`${(i * 0.13).toFixed(2)}s`} repeatCount="indefinite" />}
        </circle>
      ))}
      {BELOW.map((x, i) => {
        const x2 = CX + (x - CX) * 0.6;
        return (
          <circle key={"b" + i} cx={x} cy={still ? 260 + ((i * 41) % 150) : 246} r={3} fill="#E0F9FD">
            {!still && <>
              <animate attributeName="cy" from="246" to="416" dur="1.2s" begin={`${(0.05 + i * 0.14).toFixed(2)}s`} repeatCount="indefinite" />
              <animate attributeName="cx" values={`${x};${x};${x2}`} keyTimes="0;0.5;1" dur="1.2s" begin={`${(0.05 + i * 0.14).toFixed(2)}s`} repeatCount="indefinite" />
            </>}
          </circle>
        );
      })}
      {/* detector: pixels light up as single electrons are counted */}
      <rect data-hand="det" x={30} y={420} width={140} height={26} rx={2} fill="#14232F" stroke="#8EA2B1" strokeWidth={1.5} />
      {PIX.map(([x, d], i) => (
        <rect key={i} x={x - 4} y={428} width={8} height={10} fill="#E0F9FD" opacity={still ? (i % 3 ? 0.25 : 0.9) : 0}>
          {!still && <animate attributeName="opacity" values="0;1;0.15" dur="1.6s" begin={`${d}s`} repeatCount="indefinite" />}
        </rect>
      ))}
      {label(28, "electron gun", "200–300 kV")}
      {label(117, "condenser lenses")}
      {label(229, "sample in thin ice", "molecules + water", "#C3D0D9")}
      {label(274, "✕ bonds break", "damage builds up", "#E8559A")}
      {label(335, "objective lens")}
      {label(433, "direct detector", "counts electrons")}
      <text x={24} y={472} fill="#F2B347" fontSize={15} fontFamily="JetBrains Mono">slide 1: 24 e⁻/Å² in 1.5 s</text>
    </svg>
  );
}

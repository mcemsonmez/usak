/** One input, the matcher, three lanes. Pulses run along the lines (hidden under reduced motion). */
export function FlowDiagram() {
  const lanes = [
    { y: 60, label: "Matched", sub: "rent marked paid", color: "var(--good)" },
    { y: 160, label: "Partial", sub: "oldest debt first", color: "var(--warn)" },
    { y: 260, label: "Needs review", sub: "you pick the lease", color: "var(--bad)" },
  ];
  return (
    <svg
      viewBox="0 0 760 320"
      className="h-auto w-full"
      role="img"
      aria-label="A bank statement goes into usak and comes out as matched, partial or needs-review payments"
    >
      <defs>
        {lanes.map((l, i) => (
          <path key={i} id={`lane-${i}`} d={`M 300 160 C 400 160, 420 ${l.y}, 520 ${l.y}`} />
        ))}
        <path id="lane-in" d="M 150 160 L 230 160" />
      </defs>
      <use
        href="#lane-in"
        stroke="var(--color-ink)"
        strokeOpacity="0.25"
        strokeWidth="2"
        fill="none"
      />
      {lanes.map((l, i) => (
        <use
          key={i}
          href={`#lane-${i}`}
          stroke={l.color}
          strokeOpacity="0.5"
          strokeWidth="2"
          fill="none"
        />
      ))}
      <g className="motion-only">
        <circle r="4" fill="var(--color-ink)">
          <animateMotion dur="1.2s" repeatCount="indefinite">
            <mpath href="#lane-in" />
          </animateMotion>
        </circle>
        {lanes.map((l, i) => (
          <circle key={i} r="5" fill={l.color}>
            <animateMotion dur="1.8s" begin={`${i * 0.45}s`} repeatCount="indefinite">
              <mpath href={`#lane-${i}`} />
            </animateMotion>
          </circle>
        ))}
      </g>
      <rect x="10" y="125" width="140" height="70" rx="12" fill="white" stroke="var(--border)" />
      <text
        x="80"
        y="155"
        textAnchor="middle"
        fontSize="15"
        fontWeight="600"
        fill="var(--color-ink)"
      >
        bank.csv
      </text>
      <text x="80" y="176" textAnchor="middle" fontSize="12" fill="var(--muted-foreground)">
        any Czech bank
      </text>
      <rect x="230" y="115" width="140" height="90" rx="14" fill="var(--color-ink)" />
      <text x="300" y="155" textAnchor="middle" fontSize="16" fontWeight="600" fill="white">
        usak
      </text>
      <text x="300" y="177" textAnchor="middle" fontSize="12" fill="var(--color-lime)">
        matching
      </text>
      {lanes.map((l, i) => (
        <g key={i}>
          <rect
            x="520"
            y={l.y - 32}
            width="230"
            height="64"
            rx="12"
            fill="white"
            stroke="var(--border)"
          />
          <rect x="536" y={l.y - 8} width="16" height="16" rx="4" fill={l.color} />
          <text x="564" y={l.y - 2} fontSize="15" fontWeight="600" fill="var(--color-ink)">
            {l.label}
          </text>
          <text x="564" y={l.y + 17} fontSize="12" fill="var(--muted-foreground)">
            {l.sub}
          </text>
        </g>
      ))}
    </svg>
  );
}

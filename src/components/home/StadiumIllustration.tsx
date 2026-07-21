export default function StadiumIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#05070f" />
          <stop offset="55%" stopColor="#0a0f24" />
          <stop offset="100%" stopColor="#0f3fb0" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e0b84a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#e0b84a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4d7bea" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#4d7bea" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bowl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#131e45" />
          <stop offset="100%" stopColor="#0a0f24" />
        </linearGradient>
        <linearGradient id="pitch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a2f8c" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#05070f" />
        </linearGradient>
      </defs>

      <rect width="1600" height="900" fill="url(#sky)" />
      <circle cx="380" cy="230" r="260" fill="url(#glow1)" />
      <circle cx="1200" cy="260" r="300" fill="url(#glow2)" />

      {/* floodlight beams */}
      <g opacity="0.35">
        <polygon points="140,120 40,900 260,900" fill="#e0b84a" opacity="0.15" />
        <polygon points="1460,120 1360,900 1580,900" fill="#4d7bea" opacity="0.18" />
      </g>

      {/* stadium bowl */}
      <path
        d="M0,620 C 300,480 1300,480 1600,620 L1600,760 C1300,640 300,640 0,760 Z"
        fill="url(#bowl)"
      />
      <path
        d="M0,660 C 300,540 1300,540 1600,660 L1600,780 C1300,680 300,680 0,780 Z"
        fill="#0e1633"
        opacity="0.85"
      />

      {/* crowd texture */}
      <g opacity="0.55">
        {Array.from({ length: 140 }).map((_, i) => {
          const row = Math.floor(i / 20);
          const col = i % 20;
          const x = 40 + col * 78 + (row % 2 === 0 ? 20 : 0);
          const y = 560 + row * 26 - Math.abs(col - 10) * 4;
          const palette = ["#e0b84a", "#ffffff", "#4d7bea", "#1a56d6"];
          const fill = palette[(i * 7) % palette.length];
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={3.2}
              fill={fill}
              opacity={0.5 + ((i * 13) % 40) / 100}
            />
          );
        })}
      </g>

      {/* pitch */}
      <rect x="0" y="800" width="1600" height="100" fill="url(#pitch)" />
      <ellipse cx="800" cy="900" rx="620" ry="70" fill="none" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="2" />

      {/* confetti */}
      <g>
        {Array.from({ length: 40 }).map((_, i) => {
          const x = (i * 47) % 1600;
          const y = 60 + ((i * 113) % 500);
          const palette = ["#e0b84a", "#ffffff", "#4d7bea"];
          const fill = palette[i % palette.length];
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={5}
              height={9}
              rx={1.5}
              fill={fill}
              opacity={0.35}
              transform={`rotate(${(i * 37) % 360} ${x} ${y})`}
            />
          );
        })}
      </g>
    </svg>
  );
}

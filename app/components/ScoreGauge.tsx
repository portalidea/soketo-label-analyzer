type Props = {
  score: number;
  size?: number;
};

function colorFor(score: number) {
  if (score >= 70) return "var(--color-brand-lime)";
  if (score >= 45) return "var(--color-brand-orange)";
  return "#DC2626";
}

export default function ScoreGauge({ score, size = 96 }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const stroke = colorFor(clamped);

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Keto score ${clamped} su 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: "stroke-dasharray 600ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold leading-none" style={{ color: stroke }}>
          {clamped}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-gray">
          score
        </span>
      </div>
    </div>
  );
}

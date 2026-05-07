type Props = {
  label: string;
  value: number;
  max: number;
  unit?: string;
  tone?: "good" | "warn" | "bad" | "neutral";
};

const toneClass: Record<NonNullable<Props["tone"]>, string> = {
  good: "bg-brand-lime",
  warn: "bg-brand-orange",
  bad: "bg-red-500",
  neutral: "bg-brand-green",
};

export default function NutrientBar({
  label,
  value,
  max,
  unit = "g",
  tone = "neutral",
}: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-brand-dark">{label}</span>
        <span className="font-semibold tabular-nums text-brand-dark">
          {value.toFixed(1)} {unit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
        <div
          className={`h-full rounded-full ${toneClass[tone]} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

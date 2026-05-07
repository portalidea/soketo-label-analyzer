import type { GlutenStatus, ProfileScore } from "@/lib/types";

const SCORE_LIME = "#7AB648";
const SCORE_ORANGE = "#F5A623";
const SCORE_RED = "#EF4444";
const NEUTRAL_GRAY = "#6B7280";

function scoreColor(score: number): string {
  if (score >= 70) return SCORE_LIME;
  if (score >= 45) return SCORE_ORANGE;
  return SCORE_RED;
}

type ScoreProps = {
  kind: "score";
  icon: string;
  profileName: string;
  data: ProfileScore;
};

type StatusProps = {
  kind: "status";
  icon: string;
  profileName: string;
  data: GlutenStatus;
};

type Props = ScoreProps | StatusProps;

export default function ProfileBadge(props: Props) {
  if (props.kind === "score") {
    const color = scoreColor(props.data.score);
    return (
      <div
        className="rounded-xl border-l-4 bg-white p-3 shadow-sm"
        style={{ borderColor: color }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none" aria-hidden>
              {props.icon}
            </span>
            <span className="text-sm font-bold text-brand-dark">{props.profileName}</span>
          </div>
          <span className="text-lg font-extrabold tabular-nums" style={{ color }}>
            {props.data.score}
          </span>
        </div>
        <div
          className="mt-1 text-xs font-semibold"
          style={{ color }}
        >
          {props.data.label}
        </div>
        <div className="mt-1 text-xs leading-snug text-brand-gray">{props.data.reason}</div>
      </div>
    );
  }

  const { status, reason } = props.data;
  const meta =
    status === "compatibile"
      ? { color: SCORE_LIME, badgeBg: "rgba(122,182,72,0.15)", icon: "✓", label: "Compatibile" }
      : status === "non_compatibile"
        ? { color: SCORE_RED, badgeBg: "rgba(239,68,68,0.15)", icon: "✗", label: "Non Compatibile" }
        : { color: NEUTRAL_GRAY, badgeBg: "rgba(107,114,128,0.15)", icon: "?", label: "Da Verificare" };

  return (
    <div
      className="rounded-xl border-l-4 bg-white p-3 shadow-sm"
      style={{ borderColor: meta.color }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none" aria-hidden>
            {props.icon}
          </span>
          <span className="text-sm font-bold text-brand-dark truncate">
            {props.profileName}
          </span>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
          style={{ background: meta.badgeBg, color: meta.color }}
        >
          {meta.icon} {meta.label}
        </span>
      </div>
      <div className="mt-1 text-xs leading-snug text-brand-gray">{reason}</div>
    </div>
  );
}

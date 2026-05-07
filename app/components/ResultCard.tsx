"use client";

import { useEffect, useState } from "react";
import type { AnalyzeResponse } from "@/lib/types";
import ScoreGauge from "./ScoreGauge";
import NutrientBar from "./NutrientBar";
import ProfilesGrid from "./ProfilesGrid";
import SoKetoAlternative from "./SoKetoAlternative";
import LeadCapture from "./LeadCapture";

type Props = {
  result: AnalyzeResponse;
  onReset: () => void;
};

function topBorder(score: number) {
  if (score >= 70) return "var(--color-brand-lime)";
  if (score >= 45) return "var(--color-brand-orange)";
  return "#DC2626";
}

function badgeClass(score: number) {
  if (score >= 70) return "bg-brand-lime/15 text-brand-green";
  if (score >= 45) return "bg-brand-orange/15 text-orange-700";
  return "bg-red-100 text-red-700";
}

function netCarbsEmoji(netCarbs: number) {
  if (netCarbs <= 5) return "🥑";
  if (netCarbs <= 15) return "⚡";
  return "🚫";
}

export default function ResultCard({ result, onReset }: Props) {
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadShown, setLeadShown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!leadShown) {
        setLeadOpen(true);
        setLeadShown(true);
      }
    }, 30000);
    return () => clearTimeout(t);
  }, [leadShown]);

  const handleCtaClick = () => {
    if (!leadShown) {
      setLeadOpen(true);
      setLeadShown(true);
    }
  };

  const v = result.per100g;
  const carbsTone = result.netCarbs <= 5 ? "good" : result.netCarbs <= 15 ? "warn" : "bad";
  const sugarsTone = (v.sugars ?? 0) <= 5 ? "good" : (v.sugars ?? 0) <= 15 ? "warn" : "bad";

  return (
    <div className="space-y-4 animate-fade-in">
      {result.usedFallback && (
        <div className="rounded-xl bg-yellow-50 px-4 py-2 text-xs font-medium text-yellow-800 ring-1 ring-yellow-200">
          ⚠️ Analisi calcolata localmente (servizio AI temporaneamente non disponibile).
        </div>
      )}

      <div
        className="rounded-2xl bg-white p-5 shadow-sm"
        style={{ borderTop: `4px solid ${topBorder(result.ketoScore)}` }}
      >
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold leading-tight text-brand-dark">
              {result.productName}
            </h2>
            <span
              className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${badgeClass(result.ketoScore)}`}
            >
              {result.ketoLabel}
            </span>
            <p className="mt-3 text-sm leading-snug text-brand-gray">{result.ketoReason}</p>
          </div>
          <ScoreGauge score={result.ketoScore} />
        </div>
      </div>

      <section aria-labelledby="profiles-heading" className="space-y-2">
        <h3
          id="profiles-heading"
          className="px-1 text-sm font-bold uppercase tracking-wider text-brand-gray"
        >
          📊 Compatibilità Profili
        </h3>
        <ProfilesGrid profiles={result.profiles} />
      </section>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-gray">
          📊 Valori per 100g
        </h3>
        <div className="space-y-3">
          <NutrientBar
            label="Carboidrati netti"
            value={result.netCarbs}
            max={30}
            tone={carbsTone}
          />
          <NutrientBar
            label="Proteine"
            value={v.protein ?? 0}
            max={40}
            tone={(v.protein ?? 0) >= 15 ? "good" : "neutral"}
          />
          <NutrientBar
            label="Grassi"
            value={v.fat ?? 0}
            max={50}
            tone={(v.fat ?? 0) >= 15 ? "good" : "neutral"}
          />
          <NutrientBar
            label="Zuccheri"
            value={v.sugars ?? 0}
            max={30}
            tone={sugarsTone}
          />
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-brand-cream/70 p-3">
          <span className="text-2xl" aria-hidden>
            {netCarbsEmoji(result.netCarbs)}
          </span>
          <p className="text-sm text-brand-dark">
            <strong>{result.netCarbs.toFixed(1)}g</strong> di carboidrati netti per 100g
          </p>
        </div>
      </div>

      {(result.alerts.length > 0 || result.positives.length > 0) && (
        <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          {result.alerts.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-red-600">
                Allerte
              </h3>
              <ul className="space-y-1.5 text-sm">
                {result.alerts.map((a, i) => (
                  <li key={i} className="flex gap-2 text-brand-dark">
                    <span aria-hidden className="text-red-500">●</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.positives.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-brand-green">
                Punti positivi
              </h3>
              <ul className="space-y-1.5 text-sm">
                {result.positives.map((p, i) => (
                  <li key={i} className="flex gap-2 text-brand-dark">
                    <span aria-hidden className="text-brand-lime">●</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <SoKetoAlternative result={result} onCtaClick={handleCtaClick} />

      <button
        type="button"
        onClick={onReset}
        className="w-full rounded-full border-2 border-brand-green bg-white px-5 py-3 text-sm font-bold uppercase tracking-wide text-brand-green transition active:scale-[.98]"
      >
        🔄 Analizza un altro prodotto
      </button>

      <LeadCapture
        open={leadOpen}
        onClose={() => setLeadOpen(false)}
        source="result"
      />
    </div>
  );
}

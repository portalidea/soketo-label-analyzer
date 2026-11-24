"use client";

import { useMemo, useState } from "react";
import { mealKetoVerdict, mealTotals, type MealItem, type MealResponse } from "@/lib/meal-calc";

type Props = {
  result: MealResponse;
  onReset: () => void;
};

const toneClass = {
  good: "bg-brand-lime/15 text-brand-green",
  warn: "bg-brand-orange/15 text-orange-700",
  bad: "bg-red-100 text-red-700",
} as const;

const toneBorder = {
  good: "var(--color-brand-lime)",
  warn: "var(--color-brand-orange)",
  bad: "#DC2626",
} as const;

export default function MealResult({ result, onReset }: Props) {
  // L'utente può correggere i grammi: i totali si ricalcolano subito.
  const [items, setItems] = useState<MealItem[]>(result.items);
  const totals = useMemo(() => mealTotals(items), [items]);
  const verdict = mealKetoVerdict(totals.netCarbs);

  function setGrams(idx: number, value: string) {
    const g = Math.max(0, Math.min(2000, Math.round(Number(value.replace(",", ".")) || 0)));
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, grams: g } : it)));
  }

  if (result.items.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
          <p className="text-base font-bold text-brand-dark">Nessun piatto riconosciuto</p>
          <p className="mt-1 text-sm text-brand-gray">
            Prova con una foto dall&apos;alto, ben illuminata, con tutto il piatto inquadrato.
          </p>
        </div>
        <ResetButton onReset={onReset} />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div
        className="rounded-2xl bg-white p-5 shadow-sm"
        style={{ borderTop: `4px solid ${toneBorder[verdict.tone]}` }}
      >
        <h2 className="text-xl font-bold leading-tight text-brand-dark">{result.dishName}</h2>
        <span
          className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${toneClass[verdict.tone]}`}
        >
          {verdict.label}
        </span>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Carb netti" value={`${totals.netCarbs} g`} strong />
          <Stat label="Calorie" value={`${totals.calories} kcal`} />
          <Stat label="Proteine" value={`${totals.protein} g`} />
          <Stat label="Grassi" value={`${totals.fat} g`} />
          <Stat label="Carb totali" value={`${totals.carbs} g`} />
          <Stat label="Fibre" value={`${totals.fiber} g`} />
        </div>
        <p className="mt-3 text-[11px] text-brand-gray">
          Affidabilità della stima: <strong>{result.confidence}</strong>. Valori indicativi.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wide text-brand-green">
          Cosa c&apos;è nel piatto
        </h3>
        <p className="mt-1 text-xs text-brand-gray">
          Correggi i grammi se li conosci: i totali si aggiornano subito.
        </p>
        <ul className="mt-3 divide-y divide-gray-100">
          {items.map((it, idx) => {
            const net = Math.max(0, it.per100g.carbs - it.per100g.fiber) * (it.grams / 100);
            return (
              <li key={`${it.name}-${idx}`} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-dark">{it.name}</p>
                  <p className="text-[11px] text-brand-gray">
                    {Math.round(net * 10) / 10} g carb netti ·{" "}
                    {Math.round(it.per100g.calories * (it.grams / 100))} kcal
                  </p>
                </div>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={2000}
                    value={it.grams}
                    onChange={(e) => setGrams(idx, e.target.value)}
                    className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-right font-semibold"
                    aria-label={`Grammi di ${it.name}`}
                  />
                  <span className="text-brand-gray">g</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      {(result.ketoTip || result.notes.length > 0) && (
        <div className="space-y-2 rounded-2xl bg-white p-5 shadow-sm">
          {result.ketoTip && (
            <p className="text-sm text-brand-dark">
              <span className="font-bold text-brand-green">💡 Consiglio keto: </span>
              {result.ketoTip}
            </p>
          )}
          {result.notes.map((n, i) => (
            <p key={i} className="text-xs text-brand-gray">
              • {n}
            </p>
          ))}
        </div>
      )}

      <p className="px-1 text-[11px] leading-relaxed text-brand-gray">
        Stima automatica da foto: porzioni, condimenti e ingredienti nascosti possono far variare
        molto i valori reali. Non sostituisce il parere di un medico o di un nutrizionista.
      </p>

      <ResetButton onReset={onReset} />
    </div>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`rounded-xl px-2 py-2 ${strong ? "bg-brand-green/10" : "bg-brand-cream"}`}>
      <p className={`text-base font-bold ${strong ? "text-brand-green" : "text-brand-dark"}`}>
        {value}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-gray">{label}</p>
    </div>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button
      type="button"
      onClick={onReset}
      className="w-full rounded-full border-2 border-brand-green/30 bg-white px-5 py-3 text-sm font-bold uppercase tracking-wide text-brand-green transition active:scale-[.98]"
    >
      ↩ Analizza un altro piatto
    </button>
  );
}

"use client";

import { useMemo, useState } from "react";
import { mealKetoVerdict, mealTotals, type MealItem, type MealResponse } from "@/lib/meal-calc";
import {
  findNamedSoketo,
  findSoketoSwap,
  SOKETO_SWAPS,
  type SoketoSwap,
} from "@/lib/soketo-catalog";

/** Applica il prodotto SoKeto all'alimento (carb netti: fibre già escluse). */
function applySwap(it: MealItem, s: SoketoSwap): MealItem {
  return {
    ...it,
    name: s.name,
    per100g: {
      calories: s.per100g.calories,
      carbs: s.per100g.netCarbs,
      fiber: 0,
      protein: s.per100g.protein,
      fat: s.per100g.fat,
    },
    swap: { id: s.id, originalName: it.name, originalPer100g: it.per100g },
  };
}

/** "Sono Spaghetti SoKeto?" / "È Pan Bauletto SoKeto?" */
const SINGULAR = new Set(["riso", "pane", "piadina", "pizza", "panettone", "brioche", "crema"]);
function swapQuestion(s: SoketoSwap | null): string {
  if (!s) return "";
  return `${SINGULAR.has(s.id) ? "È" : "Sono"} ${s.name}?`;
}

function undoSwap(it: MealItem): MealItem {
  if (!it.swap) return it;
  return { ...it, name: it.swap.originalName, per100g: it.swap.originalPer100g, swap: undefined };
}

type Props = {
  result: MealResponse;
  photo?: string | null;
  onReset: () => void;
  /** Ricalcola con la correzione scritta dall'utente (es. "è bresaola, non salame"). */
  onCorrect?: (hint: string) => Promise<void>;
  recalculating?: boolean;
  error?: string | null;
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

export default function MealResult({
  result,
  photo,
  onReset,
  onCorrect,
  recalculating,
  error,
}: Props) {
  const [hint, setHint] = useState("");
  // L'utente può correggere i grammi: i totali si ricalcolano subito.
  // Se l'AI (o la correzione dell'utente) dice già "SoKeto", valori presi dall'etichetta vera.
  const [items, setItems] = useState<MealItem[]>(() =>
    result.items.map((it) => {
      const s = findNamedSoketo(it.name);
      return s ? { ...applySwap(it, s), name: it.name } : it;
    }),
  );
  const totals = useMemo(() => mealTotals(items), [items]);
  const verdict = mealKetoVerdict(totals.netCarbs);

  // Confronto: lo stesso piatto con i prodotti SoKeto al posto di pasta, pane, dolci…
  const swappable = items
    .map((it, idx) => ({ idx, s: it.swap ? null : findSoketoSwap(it.name) }))
    .filter((x): x is { idx: number; s: SoketoSwap } => x.s !== null);
  const withSoketo = useMemo(
    () =>
      mealTotals(
        items.map((it, idx) => {
          const hit = swappable.find((x) => x.idx === idx);
          return hit ? applySwap(it, hit.s) : it;
        }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  );
  const savings = Math.round((totals.netCarbs - withSoketo.netCarbs) * 10) / 10;
  const swapProducts = Array.from(new Set(swappable.map((x) => x.s.id)))
    .map((id) => SOKETO_SWAPS.find((s) => s.id === id))
    .filter((s): s is SoketoSwap => Boolean(s));

  function toggleSwap(idx: number) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        if (it.swap) return undoSwap(it);
        const s = findSoketoSwap(it.name);
        return s ? applySwap(it, s) : it;
      }),
    );
  }

  function swapAll() {
    setItems((prev) =>
      prev.map((it) => {
        if (it.swap) return it;
        const s = findSoketoSwap(it.name);
        return s ? applySwap(it, s) : it;
      }),
    );
  }

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

  const summaryCard = (
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
      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
        <Stat label="Carb netti" value={`${totals.netCarbs} g`} strong />
        <Stat label="Calorie" value={`${totals.calories} kcal`} />
        <Stat label="Proteine" value={`${totals.protein} g`} />
        <Stat label="Grassi" value={`${totals.fat} g`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {photo ? (
        // Foto con mirino e i soli totali del piatto sopra (nome, giudizio keto, 4 valori).
        <div className="relative overflow-hidden rounded-2xl bg-black shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt={result.dishName} className="block w-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/70" />
          <Corners />
          <div className="pop-in-fade absolute inset-x-0 top-0 p-4">
            <h2 className="text-lg font-extrabold leading-tight text-white drop-shadow">
              {result.dishName}
            </h2>
            <span
              className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${toneClass[verdict.tone]} bg-white`}
            >
              {verdict.label}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 grid grid-cols-4 gap-1.5 p-3">
            <PhotoStat label="Carb netti" value={`${totals.netCarbs}`} unit="g" strong delay={0} />
            <PhotoStat label="Calorie" value={`${totals.calories}`} unit="kcal" delay={1} />
            <PhotoStat label="Proteine" value={`${totals.protein}`} unit="g" delay={2} />
            <PhotoStat label="Grassi" value={`${totals.fat}`} unit="g" delay={3} />
          </div>
        </div>
      ) : (
        summaryCard
      )}

      <p className="px-1 text-[11px] text-brand-gray">
        Carb totali {totals.carbs} g · Fibre {totals.fiber} g · Affidabilità della stima:{" "}
        <strong>{result.confidence}</strong>. Valori indicativi.
      </p>

      {savings >= 3 && swapProducts.length > 0 && (
        <div className="rounded-2xl bg-brand-green p-5 text-white shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-white/80">Con SoKeto</p>
          <p className="mt-1 text-base font-bold leading-snug">
            Con {swapProducts.map((s) => s.name).join(" e ")} questo piatto avrebbe{" "}
            <span className="text-brand-lime">{withSoketo.netCarbs} g</span> di carboidrati netti
            invece di {totals.netCarbs} g.
          </p>
          <p className="mt-1 text-[11px] text-white/70">
            Valori dalle etichette SoKeto; per pasta e riso stima sul peso da cotti.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={swapAll}
              className="rounded-full bg-white px-4 py-2 text-xs font-bold text-brand-green"
            >
              L&apos;ho mangiato con SoKeto
            </button>
            {swapProducts.slice(0, 2).map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener"
                className="rounded-full border border-white/60 px-4 py-2 text-xs font-bold text-white"
              >
                Scopri {s.name} →
              </a>
            ))}
          </div>
        </div>
      )}

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
                  {(it.swap || findSoketoSwap(it.name)) && (
                    <button
                      type="button"
                      onClick={() => toggleSwap(idx)}
                      className={`mt-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        it.swap
                          ? "bg-brand-lime/15 text-brand-green"
                          : "bg-brand-orange/15 text-orange-700"
                      }`}
                    >
                      {it.swap ? `✓ SoKeto · torna a ${it.swap.originalName}` : swapQuestion(findSoketoSwap(it.name))}
                    </button>
                  )}
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

      {onCorrect && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-brand-green">
            Qualcosa non torna?
          </h3>
          <p className="mt-1 text-xs text-brand-gray">
            Scrivi cosa c&apos;è davvero nel piatto e ricalcolo i valori. Es. &quot;è bresaola, non
            salame&quot; oppure &quot;spaghetti SoKeto&quot;.
          </p>
          <textarea
            value={hint}
            onChange={(e) => setHint(e.target.value.slice(0, 300))}
            rows={2}
            placeholder="Es. bresaola e mozzarella da 125 g"
            className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={recalculating || hint.trim().length < 3}
            onClick={() => void onCorrect(hint.trim())}
            className="mt-2 w-full rounded-full bg-brand-green px-5 py-3 text-sm font-bold uppercase tracking-wide text-white shadow transition active:scale-[.98] disabled:opacity-50"
          >
            {recalculating ? "Ricalcolo in corso…" : "🔄 Correggi e ricalcola"}
          </button>
          {error && !recalculating && (
            <p className="mt-2 text-xs font-semibold text-red-700">{error}</p>
          )}
        </div>
      )}

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

function PhotoStat({
  label,
  value,
  unit,
  strong,
  delay,
}: {
  label: string;
  value: string;
  unit: string;
  strong?: boolean;
  delay: number;
}) {
  return (
    <div
      className={`pop-in-fade rounded-xl px-1 py-2 text-center shadow-lg backdrop-blur ${
        strong ? "bg-brand-lime/95" : "bg-white/90"
      }`}
      style={{ animationDelay: `${0.15 + delay * 0.12}s` }}
    >
      <p className={`text-base font-extrabold leading-none ${strong ? "text-white" : "text-brand-dark"}`}>
        {value}
        <span className="ml-0.5 text-[10px] font-bold">{unit}</span>
      </p>
      <p
        className={`mt-1 text-[9px] font-bold uppercase tracking-wide ${
          strong ? "text-white/90" : "text-brand-gray"
        }`}
      >
        {label}
      </p>
    </div>
  );
}

/** Angoli del "mirino" sopra la foto. */
function Corners() {
  const c = "absolute h-7 w-7 border-brand-lime";
  return (
    <div className="pointer-events-none absolute inset-2" aria-hidden>
      <span className={`${c} left-0 top-0 rounded-tl-xl border-l-4 border-t-4`} />
      <span className={`${c} right-0 top-0 rounded-tr-xl border-r-4 border-t-4`} />
      <span className={`${c} bottom-0 left-0 rounded-bl-xl border-b-4 border-l-4`} />
      <span className={`${c} bottom-0 right-0 rounded-br-xl border-b-4 border-r-4`} />
    </div>
  );
}

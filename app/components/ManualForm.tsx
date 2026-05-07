"use client";

import { useState } from "react";
import type { NutritionValues } from "@/lib/types";

type Props = {
  onSubmit: (values: NutritionValues, productName: string) => void;
  loading: boolean;
};

type FieldKey = keyof NutritionValues;

const FIELDS: Array<{
  key: FieldKey;
  label: string;
  unit: string;
  required?: boolean;
  placeholder?: string;
}> = [
  { key: "calories", label: "Calorie", unit: "kcal", placeholder: "0" },
  { key: "carbs", label: "Carboidrati", unit: "g", required: true, placeholder: "0" },
  { key: "sugars", label: "di cui zuccheri", unit: "g", placeholder: "0" },
  { key: "fiber", label: "Fibre", unit: "g", placeholder: "0" },
  { key: "fat", label: "Grassi", unit: "g", placeholder: "0" },
  { key: "satFat", label: "di cui saturi", unit: "g", placeholder: "0" },
  { key: "protein", label: "Proteine", unit: "g", required: true, placeholder: "0" },
  { key: "salt", label: "Sale", unit: "g", placeholder: "0" },
];

export default function ManualForm({ onSubmit, loading }: Props) {
  const [productName, setProductName] = useState("");
  const [values, setValues] = useState<Record<FieldKey, string>>({
    calories: "",
    carbs: "",
    sugars: "",
    fiber: "",
    fat: "",
    satFat: "",
    protein: "",
    salt: "",
  });

  function update(key: FieldKey, raw: string) {
    setValues((prev) => ({ ...prev, [key]: raw }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed: NutritionValues = {
      carbs: parseFloat(values.carbs) || 0,
      protein: parseFloat(values.protein) || 0,
    };
    for (const f of FIELDS) {
      if (f.key === "carbs" || f.key === "protein") continue;
      const v = parseFloat(values[f.key]);
      if (!Number.isNaN(v)) {
        (parsed as Record<string, number>)[f.key] = v;
      }
    }
    onSubmit(parsed, productName);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="productName"
          className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-gray"
        >
          Nome prodotto (facoltativo)
        </label>
        <input
          id="productName"
          type="text"
          maxLength={120}
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="es. Pasta integrale"
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label
              htmlFor={`field-${f.key}`}
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-gray"
            >
              {f.label}
              {f.required && <span className="ml-1 text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                id={`field-${f.key}`}
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                required={f.required}
                value={values[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 pr-10 text-sm tabular-nums focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-brand-gray">
                {f.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-brand-gray">
        Inserisci i valori per <strong>100g</strong> dichiarati in etichetta. I campi
        contrassegnati con <span className="text-red-500">*</span> sono obbligatori.
      </p>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-brand-green px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow transition active:scale-[.98] disabled:opacity-60"
      >
        {loading ? "Analisi in corso…" : "🔍 Analizza"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AnalyzeResponse, NutritionValues } from "@/lib/types";
import { postToNative } from "@/lib/native-bridge";
import { useEmbedded } from "./hooks/useEmbedded";
import ManualForm from "./ManualForm";
import PhotoUpload from "./PhotoUpload";
import ResultCard from "./ResultCard";
import MealResult from "./MealResult";
import MealCamera from "./MealCamera";
import type { MealResponse } from "@/lib/meal-calc";

type Tab = "photo" | "meal" | "manual";

export default function LabelAnalyzer() {
  const { isEmbedded } = useEmbedded();
  // ?mode=piatto → strumento "Analizza piatto" (solo foto del piatto);
  // senza parametro → lettore etichette (foto etichetta + dati manuali).
  const mealOnly = useSearchParams().get("mode") === "piatto";
  const [tab, setTab] = useState<Tab>(mealOnly ? "meal" : "photo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [meal, setMeal] = useState<MealResponse | null>(null);
  const [mealPhoto, setMealPhoto] = useState<string | null>(null);

  const [mealImage, setMealImage] = useState<{ data: string; mediaType: "image/jpeg" } | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  async function analyzeMeal(
    image: { data: string; mediaType: "image/jpeg"; dataUrl?: string },
    hint?: string,
  ) {
    if (image.dataUrl) setMealPhoto(image.dataUrl);
    setMealImage({ data: image.data, mediaType: image.mediaType });
    setError(null);
    setLoading(true);
    try {
      // Un secondo tentativo automatico: la prima chiamata può scadere (rete lenta o
      // analisi lunga) e il browser restituisce solo "Load failed" / "Failed to fetch".
      const body = JSON.stringify({
        image: image.data,
        mediaType: image.mediaType,
        hint: hint || undefined,
      });
      let data: MealResponse | null = null;
      let lastError = "";
      for (let attempt = 0; attempt < 2 && !data; attempt++) {
        try {
          const res = await fetch("/api/meal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });
          const text = await res.text();
          let json: unknown = null;
          try {
            json = JSON.parse(text);
          } catch {
            json = null;
          }
          if (res.ok && json && typeof json === "object" && !("error" in json)) {
            data = json as MealResponse;
          } else if (json && typeof json === "object" && "error" in json) {
            lastError = String((json as { error?: string }).error || "");
            if (res.status < 500) break; // errore della richiesta: inutile riprovare
          } else {
            lastError = `L'analisi non ha risposto in tempo (codice ${res.status}).`;
          }
        } catch {
          lastError = "L'analisi ha impiegato troppo tempo o la connessione si è interrotta.";
        }
      }
      if (!data) {
        throw new Error(`${lastError || "Errore di analisi."} Riprova tra poco.`);
      }
      setMeal(data);
    } catch (e) {
      emitError(e instanceof Error ? e.message : "Errore di rete.");
    } finally {
      setLoading(false);
    }
  }

  function emitResult(data: AnalyzeResponse) {
    setResult(data);
    if (isEmbedded) {
      postToNative({
        type: "analysis_completed",
        productName: data.productName,
        ketoScore: data.profiles.keto.score,
        scores: {
          keto: data.profiles.keto.score,
          lowCarb: data.profiles.lowCarb.score,
          diabetic: data.profiles.diabetic.score,
          lowGI: data.profiles.lowGI.score,
        },
        glutenStatus: data.profiles.glutenFree.status,
        soketoCategory: data.soketoCategory,
      });
    }
  }

  function emitError(message: string) {
    setError(message);
    if (isEmbedded) {
      postToNative({ type: "error", message });
    }
  }

  async function analyzePhoto(image: { data: string; mediaType: "image/jpeg"; dataUrl?: string }) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "photo",
          image: image.data,
          mediaType: image.mediaType,
        }),
      });
      const data = (await res.json()) as AnalyzeResponse | { error?: string };
      if (!res.ok || "error" in data) {
        throw new Error(("error" in data && data.error) || "Errore di analisi.");
      }
      emitResult(data as AnalyzeResponse);
    } catch (e) {
      emitError(e instanceof Error ? e.message : "Errore di rete.");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeManual(values: NutritionValues, productName: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "manual", values, productName: productName || undefined }),
      });
      const data = (await res.json()) as AnalyzeResponse | { error?: string };
      if (!res.ok || "error" in data) {
        throw new Error(("error" in data && data.error) || "Errore di analisi.");
      }
      emitResult(data as AnalyzeResponse);
    } catch (e) {
      emitError(e instanceof Error ? e.message : "Errore di rete.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setMeal(null);
    setError(null);
  }

  if (meal) {
    return (
      <MealResult
        key={JSON.stringify(meal).length + meal.dishName}
        result={meal}
        photo={mealPhoto}
        onReset={reset}
        recalculating={recalculating}
        error={error}
        onCorrect={
          mealImage
            ? async (hint: string) => {
                setRecalculating(true);
                await analyzeMeal(mealImage, hint);
                setRecalculating(false);
              }
            : undefined
        }
      />
    );
  }

  if (result) {
    return <ResultCard result={result} onReset={reset} />;
  }

  return (
    <div className="space-y-4">
      {!mealOnly && (
      <div
        role="tablist"
        aria-label="Modalità di analisi"
        className="grid grid-cols-2 gap-1 rounded-full bg-white p-1 shadow-sm"
      >
        <TabButton active={tab === "photo"} onClick={() => setTab("photo")}>
          📷 Foto Etichetta
        </TabButton>
        <TabButton active={tab === "manual"} onClick={() => setTab("manual")}>
          ✏️ Inserisci Dati
        </TabButton>
      </div>
      )}

      <div className="rounded-2xl bg-white/0 p-0 sm:bg-white sm:p-5 sm:shadow-sm">
        {tab === "photo" ? (
          <PhotoUpload onSubmit={analyzePhoto} loading={loading} />
        ) : tab === "meal" ? (
          <MealCamera onSubmit={analyzeMeal} loading={loading} />
        ) : (
          <ManualForm onSubmit={analyzeManual} loading={loading} />
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${
        active
          ? "bg-brand-green text-white shadow"
          : "bg-transparent text-brand-gray hover:text-brand-dark"
      }`}
    >
      {children}
    </button>
  );
}

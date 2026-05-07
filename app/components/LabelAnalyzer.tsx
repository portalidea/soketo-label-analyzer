"use client";

import { useState } from "react";
import type { AnalyzeResponse, NutritionValues } from "@/lib/types";
import ManualForm from "./ManualForm";
import PhotoUpload from "./PhotoUpload";
import ResultCard from "./ResultCard";

type Tab = "photo" | "manual";

export default function LabelAnalyzer() {
  const [tab, setTab] = useState<Tab>("photo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  async function analyzePhoto(image: { data: string; mediaType: "image/jpeg" }) {
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
      setResult(data as AnalyzeResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore di rete.");
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
      setResult(data as AnalyzeResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore di rete.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  if (result) {
    return <ResultCard result={result} onReset={reset} />;
  }

  return (
    <div className="space-y-4">
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

      <div className="rounded-2xl bg-white/0 p-0 sm:bg-white sm:p-5 sm:shadow-sm">
        {tab === "photo" ? (
          <PhotoUpload onSubmit={analyzePhoto} loading={loading} />
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

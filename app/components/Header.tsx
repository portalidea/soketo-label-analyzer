"use client";

import { useSearchParams } from "next/navigation";
import { useEmbedded } from "./hooks/useEmbedded";

export default function Header() {
  const { hideHeader } = useEmbedded();
  const meal = useSearchParams().get("mode") === "piatto";
  if (hideHeader) return null;

  return (
    <header className="bg-brand-green px-5 py-6 text-white shadow-md">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <span className="text-3xl" aria-hidden>
          {meal ? "🍽️" : "🔬"}
        </span>
        <div>
          <h1 className="text-lg font-extrabold leading-tight tracking-tight">
            {meal ? "Analizza Piatto" : "Label Analyzer"}
          </h1>
          <p className="text-xs font-medium text-white/80">
            by SoKeto<span className="align-super text-[0.55em]">®</span> — Analisi Keto
            Istantanea
          </p>
        </div>
      </div>
    </header>
  );
}

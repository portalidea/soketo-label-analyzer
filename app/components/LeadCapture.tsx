"use client";

import { useState } from "react";
import { postToNative } from "@/lib/native-bridge";
import { useEmbedded } from "./hooks/useEmbedded";

type Props = {
  open: boolean;
  onClose: () => void;
  source?: string;
};

export default function LeadCapture({ open, onClose, source }: Props) {
  const { isEmbedded } = useEmbedded();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Errore. Riprova.");
      }
      if (isEmbedded) {
        postToNative({ type: "lead_captured", email });
      }
      setDone(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore. Riprova.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-6 sm:items-center sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-fade-in">
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          className="ml-auto block text-2xl leading-none text-brand-gray hover:text-brand-dark"
        >
          ×
        </button>
        <h3 id="lead-title" className="text-lg font-bold text-brand-green">
          📘 Ricevi la guida keto gratuita
        </h3>
        <p className="mt-1 text-sm text-brand-gray">
          Ricette, consigli e una lista della spesa keto-friendly nella tua casella.
        </p>

        {done ? (
          <p className="mt-4 rounded-lg bg-brand-lime/15 p-3 text-sm font-semibold text-brand-green">
            Grazie! Controlla la tua email. ✉️
          </p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.it"
              className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
            />
            {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-brand-green px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition active:scale-[.98] disabled:opacity-60"
            >
              {submitting ? "Invio…" : "Invia"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="block w-full text-center text-xs font-medium text-brand-gray underline-offset-2 hover:underline"
            >
              Salta
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

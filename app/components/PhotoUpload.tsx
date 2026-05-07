"use client";

import { useRef, useState } from "react";

type Props = {
  onSubmit: (image: { data: string; mediaType: "image/jpeg" }) => void;
  loading: boolean;
};

const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.85;
const ACCEPT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export default function PhotoUpload({ onSubmit, loading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    if (!ACCEPT_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
      setError("Formato non supportato. Usa JPG, PNG o WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File troppo grande (max 10MB).");
      return;
    }
    setProcessing(true);
    try {
      const compressed = await compressImage(file);
      setPreview(compressed.dataUrl);
      setBase64(compressed.base64);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore nel caricamento dell'immagine.");
    } finally {
      setProcessing(false);
    }
  }

  function reset() {
    setPreview(null);
    setBase64(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function submit() {
    if (!base64) return;
    onSubmit({ data: base64, mediaType: "image/jpeg" });
  }

  return (
    <div className="space-y-3">
      {!preview && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
          className="flex h-56 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-green/40 bg-white p-6 text-center transition hover:border-brand-green hover:bg-brand-green/5 disabled:opacity-60"
        >
          <span className="text-4xl" aria-hidden>
            📷
          </span>
          <span className="text-sm font-semibold text-brand-green">
            {processing ? "Elaborazione…" : "Tocca per scattare o caricare"}
          </span>
          <span className="text-xs text-brand-gray">
            Inquadra l&apos;etichetta nutrizionale
          </span>
        </button>
      )}

      {preview && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Anteprima etichetta" className="block w-full" />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}

      {preview && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={submit}
            disabled={loading || !base64}
            className="w-full rounded-full bg-brand-green px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow transition active:scale-[.98] disabled:opacity-60"
          >
            {loading ? "Analisi in corso…" : "🔍 Analizza Etichetta"}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={loading}
            className="w-full rounded-full border-2 border-brand-green/30 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-brand-green transition active:scale-[.98] disabled:opacity-60"
          >
            ↩ Cambia immagine
          </button>
        </div>
      )}
    </div>
  );
}

async function compressImage(file: File): Promise<{ dataUrl: string; base64: string }> {
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  const ratio = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const targetW = Math.round(img.width * ratio);
  const targetH = Math.round(img.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non supportato dal browser.");
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const compressedDataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const base64 = compressedDataUrl.split(",")[1] ?? "";
  if (!base64) throw new Error("Compressione immagine fallita.");
  return { dataUrl: compressedDataUrl, base64 };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Lettura file fallita."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Caricamento immagine fallito."));
    img.src = src;
  });
}

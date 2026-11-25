"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PhotoUpload from "./PhotoUpload";

type Shot = { data: string; mediaType: "image/jpeg"; dataUrl?: string };

type Props = {
  onSubmit: (image: Shot) => void;
  loading: boolean;
};

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.8;
/** Campionamento per capire se il telefono è fermo. */
const SAMPLE_MS = 250;
const SAMPLE_SIZE = 32;
/** Differenza media (0-255) sotto cui il frame è considerato "fermo". */
const STILL_THRESHOLD = 9;
/** Campioni fermi consecutivi prima dello scatto automatico (~1,25 s). */
const STILL_SAMPLES = 5;

type Phase = "idle" | "starting" | "live" | "captured" | "fallback";

/**
 * Fotocamera dentro la pagina con mirino e linea di scansione:
 * quando il telefono resta fermo ~1 secondo scatta da sola e avvia l'analisi.
 * Se la fotocamera non è disponibile (permesso negato, browser/WebView senza supporto)
 * torna al pulsante "scatta o carica".
 */
export default function MealCamera({ onSubmit, loading }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevRef = useRef<Uint8ClampedArray | null>(null);
  const stillRef = useRef(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [still, setStill] = useState(0);
  const [shot, setShot] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const ratio = Math.min(1, MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * ratio);
    canvas.height = Math.round(video.videoHeight * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    const base64 = dataUrl.split(",")[1] ?? "";
    stop();
    if (!base64) {
      setNotice("Scatto non riuscito, riprova.");
      setPhase("idle");
      return;
    }
    setShot(dataUrl);
    setPhase("captured");
    onSubmit({ data: base64, mediaType: "image/jpeg", dataUrl });
  }, [onSubmit, stop]);

  const watchStillness = useCallback(() => {
    const small = document.createElement("canvas");
    small.width = SAMPLE_SIZE;
    small.height = SAMPLE_SIZE;
    const sctx = small.getContext("2d", { willReadFrequently: true });
    prevRef.current = null;
    stillRef.current = 0;
    setStill(0);
    timerRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || !sctx || video.readyState < 2) return;
      sctx.drawImage(video, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      const px = sctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
      const prev = prevRef.current;
      if (prev) {
        let diff = 0;
        for (let i = 0; i < px.length; i += 4) {
          diff += Math.abs(px[i] - prev[i]) + Math.abs(px[i + 1] - prev[i + 1]) + Math.abs(px[i + 2] - prev[i + 2]);
        }
        diff /= (px.length / 4) * 3;
        stillRef.current = diff < STILL_THRESHOLD ? stillRef.current + 1 : 0;
        setStill(stillRef.current);
        if (stillRef.current >= STILL_SAMPLES) capture();
      }
      prevRef.current = new Uint8ClampedArray(px);
    }, SAMPLE_MS);
  }, [capture]);

  async function start() {
    setNotice(null);
    setShot(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase("fallback");
      return;
    }
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }
      setPhase("live");
      // Mezzo secondo per mettere a fuoco prima di iniziare a misurare la stabilità.
      setTimeout(watchStillness, 500);
    } catch (err) {
      stop();
      const name = err instanceof Error ? err.name : "";
      setNotice(
        name === "NotAllowedError"
          ? "Accesso alla fotocamera negato: abilitalo nelle impostazioni del browser, oppure scatta o carica la foto."
          : `Non riesco ad aprire la fotocamera qui (${name || "errore"}): scatta o carica la foto.`,
      );
      setPhase("fallback");
    }
  }

  function retake() {
    setShot(null);
    void start();
  }

  if (phase === "fallback") {
    return (
      <div className="space-y-2">
        {notice && <p className="text-xs font-semibold text-brand-gray">{notice}</p>}
        <PhotoUpload
          onSubmit={onSubmit}
          loading={loading}
          hint="Fotografa il piatto dall'alto, tutto inquadrato"
          submitLabel="🍽️ Analizza Piatto"
        />
      </div>
    );
  }

  const progress = Math.min(1, still / STILL_SAMPLES);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black shadow-sm">
        {/* Video sempre montato: serve al ref anche prima dell'avvio */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`h-full w-full object-cover ${phase === "live" || phase === "starting" ? "" : "hidden"}`}
        />
        {shot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot} alt="Piatto inquadrato" className="absolute inset-0 h-full w-full object-cover" />
        )}

        {phase === "idle" && (
          <button
            type="button"
            onClick={() => void start()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white text-center"
          >
            <span className="text-4xl" aria-hidden>
              🍽️
            </span>
            <span className="text-sm font-bold text-brand-green">Tocca per inquadrare il piatto</span>
            <span className="px-6 text-xs text-brand-gray">
              Tieni fermo il telefono sopra il piatto: lo scatto parte da solo
            </span>
          </button>
        )}

        {(phase === "live" || phase === "starting" || (phase === "captured" && loading)) && (
          <>
            <div className="pointer-events-none absolute inset-[8%] rounded-2xl border-2 border-white/70" />
            <div className="scan-line" aria-hidden />
          </>
        )}

        {phase === "live" && (
          <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-2">
            <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white">
              {progress > 0 ? "Tieni fermo…" : "Inquadra tutto il piatto"}
            </span>
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full rounded-full bg-brand-lime transition-[width] duration-200"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}

        {phase === "captured" && loading && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white">
              Analizzo il piatto…
            </span>
          </div>
        )}
      </div>

      {phase === "live" && (
        <button
          type="button"
          onClick={capture}
          className="w-full rounded-full bg-brand-green px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow transition active:scale-[.98]"
        >
          📸 Scatta ora
        </button>
      )}

      {phase === "captured" && !loading && (
        <button
          type="button"
          onClick={retake}
          className="w-full rounded-full border-2 border-brand-green/30 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-brand-green"
        >
          ↩ Riprova
        </button>
      )}

      {(phase === "idle" || phase === "live") && (
        <button
          type="button"
          onClick={() => {
            stop();
            setPhase("fallback");
          }}
          className="w-full text-center text-xs font-semibold text-brand-gray underline"
        >
          Preferisci caricare una foto?
        </button>
      )}

      {notice && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">{notice}</p>
      )}
    </div>
  );
}

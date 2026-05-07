import LabelAnalyzer from "./components/LabelAnalyzer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-brand-cream">
      <header className="bg-brand-green px-5 py-6 text-white shadow-md">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <span className="text-3xl" aria-hidden>
            🔬
          </span>
          <div>
            <h1 className="text-lg font-extrabold leading-tight tracking-tight">
              Label Analyzer
            </h1>
            <p className="text-xs font-medium text-white/80">
              by SoKeto<span className="align-super text-[0.55em]">®</span> — Analisi Keto
              Istantanea
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 sm:py-8">
        <LabelAnalyzer />
      </main>

      <footer className="mx-auto w-full max-w-md px-5 py-6 text-[11px] leading-relaxed text-brand-gray">
        <p>
          Le informazioni fornite hanno scopo puramente informativo e non sostituiscono il
          parere di un medico o nutrizionista qualificato. La valutazione di compatibilità
          con la dieta chetogenica si basa sull&apos;analisi automatica dei valori dichiarati
          in etichetta e può presentare imprecisioni. SoKeto<span className="align-super">®</span>{" "}
          è un marchio registrato di E-Keto Food Srls.
        </p>
      </footer>
    </div>
  );
}

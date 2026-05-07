"use client";

import { useEmbedded } from "./hooks/useEmbedded";

export default function Footer() {
  const { hideFooter } = useEmbedded();
  if (hideFooter) return null;

  return (
    <footer className="mx-auto w-full max-w-md px-5 py-6 text-[11px] leading-relaxed text-brand-gray">
      <p>
        Le informazioni fornite hanno scopo puramente informativo e non sostituiscono il
        parere di un medico o nutrizionista qualificato. La valutazione di compatibilità
        con la dieta chetogenica si basa sull&apos;analisi automatica dei valori dichiarati
        in etichetta e può presentare imprecisioni. SoKeto<span className="align-super">®</span>{" "}
        è un marchio registrato di E-Keto Food Srls.
      </p>
    </footer>
  );
}

"use client";

import { useEmbedded } from "./hooks/useEmbedded";

export default function Footer() {
  const { hideFooter } = useEmbedded();
  if (hideFooter) return null;

  return (
    <footer className="mx-auto w-full max-w-md px-5 py-6 text-[11px] leading-relaxed text-brand-gray">
      <p>
        Le valutazioni fornite hanno scopo puramente informativo e non sostituiscono il
        parere di un medico, nutrizionista o dietista qualificato. Le compatibilità con
        dieta chetogenica, low-carb, senza glutine, per diabetici e a basso indice
        glicemico si basano sull&apos;analisi automatica dei valori dichiarati in etichetta
        e possono presentare imprecisioni. Lo stato &quot;da verificare&quot; sul glutine indica
        la necessità di consultare ingredienti completi e produttore. SoKeto
        <span className="align-super">®</span> è un marchio registrato di E-Keto Food Srls.
      </p>
    </footer>
  );
}

import { findSoketoProduct } from "@/lib/soketo-products";
import type { AnalyzeResponse } from "@/lib/types";

type Props = {
  result: AnalyzeResponse;
  onCtaClick?: () => void;
};

export default function SoKetoAlternative({ result, onCtaClick }: Props) {
  const product = findSoketoProduct(result.soketoCategory);
  const productUrl = product?.url ?? "https://soketo.it";

  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-green to-brand-green-dark p-5 text-white shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
        Alternativa SoKeto<span className="align-super text-[0.55em]">®</span>
      </p>
      <h3 className="mt-1 text-lg font-bold">{product?.name ?? "Linea SoKeto®"}</h3>
      <p className="mt-1 text-sm leading-snug text-white/90">
        {result.soketoSuggestion || product?.desc}
      </p>
      <a
        href={productUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onCtaClick}
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-brand-orange px-5 py-3 text-sm font-bold uppercase tracking-wide text-white shadow transition active:scale-[.98]"
      >
        Scopri i Prodotti SoKeto<span className="ml-1 align-super text-[0.6em]">®</span>
        <span className="ml-2">→</span>
      </a>
    </div>
  );
}

# SoKeto Label Analyzer

Web app AI-powered di **E-Keto Food Srls** (brand SoKeto® / KetoValley®) per analizzare etichette nutrizionali e calcolarne la compatibilità con la dieta chetogenica. Restituisce un Keto Score, l'analisi dei macro, allerte/punti positivi e suggerisce un prodotto SoKeto® alternativo.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Anthropic Claude API** (`claude-sonnet-4-5`) per Vision e analisi testuale
- **Zod** per la validazione lato server
- Mobile-first, no DB (Fase 1)

## Setup locale

```bash
git clone <repo>
cd soketo-label-analyzer
npm install
cp .env.example .env.local       # poi inserisci la tua ANTHROPIC_API_KEY
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

### Variabili d'ambiente

| Variabile           | Descrizione                                                              | Obbligatoria |
| ------------------- | ------------------------------------------------------------------------ | ------------ |
| `ANTHROPIC_API_KEY` | API key Anthropic (https://console.anthropic.com/). Senza, il backend usa il fallback rule-based per la modalità manuale e ritorna errore per la modalità foto. | Sì (per Vision) |

## Architettura

```
app/
├── page.tsx                 # Landing mobile-first + footer disclaimer
├── layout.tsx               # Poppins, brand colors, metadata SEO
├── globals.css              # Tailwind v4 + brand tokens
├── api/
│   ├── analyze/route.ts     # POST analisi (foto base64 o valori manuali)
│   └── lead/route.ts        # POST email (stub per integrazione GHL futura)
└── components/
    ├── LabelAnalyzer.tsx    # Container con tab + state
    ├── PhotoUpload.tsx      # Upload + preview + compress canvas (max 1200px, JPEG 85%)
    ├── ManualForm.tsx       # Form valori per 100g
    ├── ResultCard.tsx       # Hero + macro + allerte + alternativa
    ├── ScoreGauge.tsx       # Gauge SVG circolare
    ├── NutrientBar.tsx      # Barra orizzontale con colorazione tonale
    ├── SoKetoAlternative.tsx# Card prodotto SoKeto matching
    └── LeadCapture.tsx      # Modal email opzionale
lib/
├── types.ts                 # AnalyzeRequest/Response, NutritionValues, …
├── anthropic.ts             # Client + prompt italiano + prompt caching
├── keto-scoring.ts          # Fallback rule-based + alerts/positives
└── soketo-products.ts       # Catalogo mock (Fase 2: Shopify Admin API)
```

### Flusso di analisi

1. Il client (LabelAnalyzer) costruisce la richiesta:
   - **Photo**: l'immagine viene compressa lato client via Canvas (max 1200px lato lungo, JPEG 85%) e codificata in base64.
   - **Manual**: i valori del form vengono inviati come oggetto.
2. `/api/analyze` valida con Zod, chiama Claude (`claude-sonnet-4-5`) con il system prompt italiano marcato `cache_control: ephemeral` per il prompt caching.
3. La risposta JSON viene sanitizzata (clamp dei numeri, validazione enum) e arricchita con il prodotto SoKeto match.
4. Se la chiamata Claude fallisce e siamo in modalità manuale, viene usato il fallback `ruleBasedAnalyze` con flag `usedFallback: true` (la UI mostra un avviso discreto). Per la modalità foto non c'è fallback (nessun input per il rule-based), quindi viene restituito un errore.

## Aggiornare il catalogo prodotti SoKeto®

Nella Fase 1 i prodotti vivono in `lib/soketo-products.ts`. Per aggiungerne uno:

```ts
{
  id: "nuovo-id",
  name: "Nome Prodotto SoKeto®",
  category: "snack",            // pasta | pane | snack | spread | farina | bevande | altro
  netCarbs: 3.5,
  protein: 15,
  fat: 12,
  desc: "Descrizione breve mostrata nella card.",
  url: "https://soketo.it/products/nuovo-id",
}
```

In Fase 2 questo file sarà sostituito da una fetch verso Shopify Admin API o da un JSON statico aggiornato via CI.

## Deploy su Vercel

1. Push del repo su GitHub (es. `portalidea/soketo-label-analyzer`).
2. Su Vercel: **Import Project** → seleziona il repo.
3. Aggiungi la variabile d'ambiente `ANTHROPIC_API_KEY` (Production, Preview, Development).
4. **Deploy**.
5. Sul registrar di `ketovalley.it` (Cloudflare): aggiungi un record `CNAME analyzer → cname.vercel-dns.com`.
6. Su Vercel: **Settings → Domains** → aggiungi `analyzer.ketovalley.it`.

L'endpoint `/api/analyze` ha `runtime = "nodejs"` e `maxDuration = 60` (Claude Vision può impiegare 5–15s su foto reali).

## Note Fase 2 (non implementato)

- **Lead capture → GoHighLevel**: `/api/lead` è uno stub che logga in `console.log`. Per collegarlo, sostituire con un POST al webhook GHL (env `GHL_WEBHOOK_URL`) e inserire i tag rilevanti.
- **Catalogo Shopify**: sostituire `soketo-products.ts` con un wrapper attorno a Shopify Admin API + caching ISR.
- **Analytics**: Supabase per persistere le analisi (opzionale).
- **Multilingua**: aggiungere route `[locale]` con `next-intl`.
- **PWA**: aggiungere manifest + service worker per installazione.

## Disclaimer legale

Le informazioni fornite hanno scopo puramente informativo e non sostituiscono il parere di un medico o nutrizionista qualificato. La valutazione di compatibilità con la dieta chetogenica si basa sull'analisi automatica dei valori dichiarati in etichetta e può presentare imprecisioni. SoKeto® è un marchio registrato di E-Keto Food Srls.

// Catalogo SoKeto per il confronto "con il prodotto SoKeto" nell'analisi del piatto.
// Valori dalle tabelle nutrizionali Shopify (campo "Scheda nutrizionale", nov 2026).
// Nelle etichette UE i "Carboidrati" escludono già le fibre: sono carboidrati netti.
// Pasta e riso: valori per 100 g COTTI, stimando che il peso raddoppi in cottura
// (dato del produttore non disponibile: da aggiornare quando c'è).

export type SoketoSwap = {
  id: string;
  name: string;
  url: string;
  match: RegExp;
  cookedFactor: number;
  per100g: { calories: number; netCarbs: number; protein: number; fat: number };
};

export const SOKETO_SWAPS: SoketoSwap[] = [
  {
    id: "spaghetti",
    name: "Spaghetti SoKeto",
    url: "https://soketo.it/products/spaghetti-low-carb-cheto-500-g-4gr-carbo",
    match: /spaghett|linguin|bucatin|vermicell/i,
    cookedFactor: 2.0,
    // Etichetta Shopify (per 100 g: 8 g carboidrati); valori sotto per 100 g COTTI (stima peso x2.0)
    per100g: { calories: 139.5, netCarbs: 4.0, protein: 17.5, fat: 2.4 },
  },
  {
    id: "fusilli",
    name: "Fusilli SoKeto",
    url: "https://soketo.it/products/fusilli-low-carb-cheto-250g-2-5gr-carbo",
    match: /fusill|rotin|eliche/i,
    cookedFactor: 2.0,
    // Etichetta Shopify (per 100 g: 5 g carboidrati); valori sotto per 100 g COTTI (stima peso x2.0)
    per100g: { calories: 145.0, netCarbs: 2.5, protein: 18.0, fat: 2.0 },
  },
  {
    id: "penne",
    name: "Penne SoKeto",
    url: "https://soketo.it/products/penne-low-carb-cheto-250-gr-2-5gr-carbo",
    match: /penne|rigaton|maccheron|mezze maniche|pasta corta|paccher/i,
    cookedFactor: 2.0,
    // Etichetta Shopify (per 100 g: 5 g carboidrati); valori sotto per 100 g COTTI (stima peso x2.0)
    per100g: { calories: 145.0, netCarbs: 2.5, protein: 18.0, fat: 2.0 },
  },
  {
    id: "tagliatelle",
    name: "Tagliatelle SoKeto",
    url: "https://soketo.it/products/tagliatelle-cheto-low-carb-250gr",
    match: /tagliatell|fettuccin|pappardell|tagliolin/i,
    cookedFactor: 2.0,
    // Etichetta Shopify (per 100 g: 8 g carboidrati); valori sotto per 100 g COTTI (stima peso x2.0)
    per100g: { calories: 139.5, netCarbs: 4.0, protein: 18.0, fat: 2.4 },
  },
  {
    id: "riso",
    name: "Riso SoKeto",
    url: "https://soketo.it/products/riso-low-carb-cheto-250gr-2-5g-carbo",
    match: /\briso\b|risotto/i,
    cookedFactor: 2.0,
    // Etichetta Shopify (per 100 g: 8 g carboidrati); valori sotto per 100 g COTTI (stima peso x2.0)
    per100g: { calories: 145.0, netCarbs: 4.0, protein: 18.0, fat: 2.4 },
  },
  {
    id: "lasagne",
    name: "Lasagne SoKeto",
    url: "https://soketo.it/products/lasagne-senza-glutine-solo-6gr-di-carbo-pronte-in-1-minuto",
    match: /lasagn/i,
    cookedFactor: 1.0,
    // Etichetta Shopify (per 100 g: 4 g carboidrati); valori sotto per 100 g come venduto
    per100g: { calories: 161.0, netCarbs: 4.0, protein: 14.0, fat: 9.0 },
  },
  {
    id: "panino",
    name: "Panini Keto SoKeto",
    url: "https://soketo.it/products/pane-chetogenico-ai-semi-di-sesamo-2-x-60gr-copia",
    // Panino al sesamo per hamburger (60 g): solo il pane, non la carne dell'hamburger
    match: /panin|pane (per|da|del|dell'|dello)? ?(hamburger|burger)|burger bun|\bbun\b|pane burger|sandwich/i,
    cookedFactor: 1.0,
    // Valori dalla scheda "Hamburger Cheto panino" (per 100 g: 381 kcal, 4,5 g carboidrati);
    // la scheda del prodotto attivo "Pane Chetogenico ai Semi di Sesamo" è vuota su Shopify.
    per100g: { calories: 381, netCarbs: 4.5, protein: 12, fat: 29 },
  },
  {
    id: "pane",
    name: "Pan Bauletto SoKeto",
    url: "https://soketo.it/products/pane-chetogenico-bauletto",
    match: /\bpane\b|pan carr|bauletto|toast|bruschett|crostin|baguette|focaccia/i,
    cookedFactor: 1.0,
    // Etichetta Shopify (per 100 g: 7,7 g carboidrati); valori sotto per 100 g come venduto
    per100g: { calories: 346.0, netCarbs: 7.7, protein: 12.0, fat: 23.0 },
  },
  {
    id: "piadina",
    name: "Piadina SoKeto",
    url: "https://soketo.it/products/piadina-chetogenica-85-gr",
    match: /piadin|wrap|tortilla/i,
    cookedFactor: 1.0,
    // Etichetta Shopify (per 85 g (1 piadina): 6,8 g carboidrati); valori sotto per 100 g come venduto
    per100g: { calories: 363.5, netCarbs: 8.0, protein: 12.9, fat: 24.7 },
  },
  {
    id: "pizza",
    name: "Pizza SoKeto",
    url: "https://soketo.it/products/base-pizza-low-carb-con-olio-di-cocco-180-gr",
    match: /pizza/i,
    cookedFactor: 1.0,
    // Etichetta Shopify (per 100 g: 11 g carboidrati); valori sotto per 100 g come venduto
    per100g: { calories: 297.0, netCarbs: 11.0, protein: 15.0, fat: 15.0 },
  },
  {
    id: "panettone",
    name: "Panettone SoKeto",
    url: "https://soketo.it/products/panettone-artigianale-keto-low-carb-500-gr-con-gocce-di-cioccolato",
    match: /panetton|pandoro|colomba/i,
    cookedFactor: 1.0,
    // Etichetta Shopify (per 100 g: 8 g carboidrati); valori sotto per 100 g come venduto
    per100g: { calories: 328.0, netCarbs: 8.0, protein: 20.0, fat: 20.0 },
  },
  {
    id: "brioche",
    name: "Brioche SoKeto",
    url: "https://soketo.it/products/brioche-cheto-2x50g-4g-di-carbo",
    match: /brioche|cornett|croissant/i,
    cookedFactor: 1.0,
    // Etichetta Shopify (per 50 g: 3,9 g carboidrati); valori sotto per 100 g come venduto
    per100g: { calories: 370.0, netCarbs: 7.8, protein: 14.0, fat: 26.0 },
  },
  {
    id: "biscotti",
    name: "Frollini SoKeto",
    url: "https://soketo.it/products/biscotti-frollini-senza-glutine-con-cioccolato-0-zuccheri",
    match: /biscott|frollin/i,
    cookedFactor: 1.0,
    // Etichetta Shopify (per 100 g: 3,01 g carboidrati); valori sotto per 100 g come venduto
    per100g: { calories: 442.0, netCarbs: 3.01, protein: 40.1, fat: 24.0 },
  },
  {
    id: "fette",
    name: "Fette biscottate SoKeto",
    url: "https://soketo.it/products/fette-biscottate-keto-low-carb-0-di-zuccheri",
    match: /fette biscottat/i,
    cookedFactor: 1.0,
    // Etichetta Shopify (per 40 g: 2,7 g carboidrati); valori sotto per 100 g come venduto
    per100g: { calories: 390.0, netCarbs: 6.75, protein: 40.0, fat: 16.2 },
  },
  {
    id: "crema",
    name: "Crema spalmabile SoKeto",
    url: "https://soketo.it/products/crema-spalmabile-keto-alle-nocciole-e-cacao-0-di-zuccheri-gr-300",
    match: /nutella|crema spalmabil|crema (alle )?nocciol/i,
    cookedFactor: 1.0,
    // Etichetta Shopify (per 100 g: 38 g carboidrati); valori sotto per 100 g come venduto
    // 38 g carboidrati di cui 33 g polioli (eritritolo, non contano): netti ~5 g
    per100g: { calories: 473, netCarbs: 5, protein: 16, fat: 34 },
  },
  {
    id: "grissini",
    name: "Grissini SoKeto",
    url: "https://soketo.it/products/grissini-senza-glutine-0-zuccheri",
    match: /grissin|cracker|taralli/i,
    cookedFactor: 1.0,
    // Etichetta Shopify (per 100 g: 3,01 g carboidrati); valori sotto per 100 g come venduto
    per100g: { calories: 443.0, netCarbs: 3.01, protein: 40.1, fat: 24.0 },
  },
];

/** Alimenti già low carb / SoKeto: niente sostituzione proposta. */
const ALREADY_LOW_CARB = /soketo|keto|cheto|low ?carb|proteic|konjac|shirataki|zucchin|cavolfior/i;

/** Alimento già indicato come SoKeto (es. "Spaghetti SoKeto"): usa i valori veri dell'etichetta. */
export function findNamedSoketo(itemName: string): SoketoSwap | null {
  if (!/soketo|cheto/i.test(itemName)) return null;
  return SOKETO_SWAPS.find((s) => s.match.test(itemName)) ?? null;
}

export function findSoketoSwap(itemName: string): SoketoSwap | null {
  if (ALREADY_LOW_CARB.test(itemName)) return null;
  return SOKETO_SWAPS.find((s) => s.match.test(itemName)) ?? null;
}

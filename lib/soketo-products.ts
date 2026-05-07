import type { SoketoCategory, SoketoProduct } from "./types";

export const SOKETO_PRODUCTS: SoketoProduct[] = [
  {
    id: "pasta-penne",
    name: "Pasta Penne SoKeto®",
    category: "pasta",
    netCarbs: 2.8,
    protein: 24,
    fat: 5.2,
    desc: "Alta proteina, solo 2.8g di carboidrati netti per 100g.",
    url: "https://soketo.it/products/pasta-penne",
  },
  {
    id: "pane-tostato",
    name: "Pane Tostato SoKeto®",
    category: "pane",
    netCarbs: 4.1,
    protein: 18,
    fat: 8.3,
    desc: "Sostituto del pane tradizionale, gluten-free e ricco di fibre.",
    url: "https://soketo.it/products/pane-tostato",
  },
  {
    id: "biscotti",
    name: "Biscotti SoKeto®",
    category: "snack",
    netCarbs: 3.5,
    protein: 15,
    fat: 12,
    desc: "Snack keto-friendly, zero zuccheri aggiunti.",
    url: "https://soketo.it/products/biscotti",
  },
  {
    id: "crema-nocciole",
    name: "Crema Nocciole SoKeto®",
    category: "spread",
    netCarbs: 5.2,
    protein: 12,
    fat: 28,
    desc: "Spalmabile low-carb senza olio di palma né zuccheri aggiunti.",
    url: "https://soketo.it/products/crema-nocciole",
  },
  {
    id: "farina",
    name: "Farina SoKeto®",
    category: "farina",
    netCarbs: 3.1,
    protein: 22,
    fat: 6.8,
    desc: "Farina alternativa per ricette keto: pizza, pane, dolci.",
    url: "https://soketo.it/products/farina",
  },
];

export function findSoketoProduct(category: SoketoCategory): SoketoProduct | undefined {
  return SOKETO_PRODUCTS.find((p) => p.category === category);
}

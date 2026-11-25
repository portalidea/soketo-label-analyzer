export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

/**
 * Formato reale dell'immagine dai primi byte del base64.
 * Alcuni browser (es. Safari su iPhone) possono produrre un PNG anche quando si chiede
 * un JPEG: l'API rifiuta l'immagine se il tipo dichiarato non corrisponde.
 */
export function detectImageMediaType(
  base64: string,
  declared: "image/jpeg" | "image/png" | "image/webp",
): ImageMediaType {
  const head = base64.slice(0, 16);
  if (head.startsWith("/9j/")) return "image/jpeg";
  if (head.startsWith("iVBORw0KGgo")) return "image/png";
  if (head.startsWith("UklGR")) return "image/webp";
  if (head.startsWith("R0lGOD")) return "image/gif";
  return declared;
}

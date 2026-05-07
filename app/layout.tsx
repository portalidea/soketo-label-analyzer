import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SoKeto Label Analyzer — Analisi Keto Istantanea",
  description:
    "Scansiona o inserisci i valori nutrizionali e scopri se un prodotto è compatibile con la dieta chetogenica. Powered by SoKeto®.",
  applicationName: "SoKeto Label Analyzer",
  authors: [{ name: "E-Keto Food Srls" }],
  keywords: ["keto", "chetogenica", "etichetta", "nutrizione", "SoKeto", "KetoValley"],
  openGraph: {
    title: "SoKeto Label Analyzer",
    description:
      "Analisi keto istantanea: scansiona un'etichetta nutrizionale e scopri il Keto Score.",
    type: "website",
    locale: "it_IT",
    siteName: "SoKeto",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#2D5A27",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-brand-cream text-brand-dark">
        {children}
      </body>
    </html>
  );
}

import { Suspense } from "react";
import LabelAnalyzer from "./components/LabelAnalyzer";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MainShell from "./components/MainShell";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-brand-cream">
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <Suspense fallback={<main className="mx-auto w-full max-w-md flex-1 px-4 py-5" />}>
        <MainShell>
          <LabelAnalyzer />
        </MainShell>
      </Suspense>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}

"use client";

import { useEmbedded } from "./hooks/useEmbedded";

export default function MainShell({ children }: { children: React.ReactNode }) {
  const { isEmbedded } = useEmbedded();
  const className = isEmbedded
    ? "w-full flex-1 px-3 py-3"
    : "mx-auto w-full max-w-md flex-1 px-4 py-5 sm:py-8";
  return <main className={className}>{children}</main>;
}

"use client";

import { useEffect, useState } from "react";

type LoggedEvent = {
  ts: string;
  payload: unknown;
};

export default function EmbeddedTest() {
  const [events, setEvents] = useState<LoggedEvent[]>([]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (typeof e.data !== "object" || e.data === null) return;
      setEvents((prev) =>
        [{ ts: new Date().toLocaleTimeString("it-IT"), payload: e.data }, ...prev].slice(0, 20),
      );
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        margin: 0,
        background: "#0F172A",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          background: "#1A1A1A",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <span style={{ fontWeight: 700 }}>🟦 SoKeto App (simulazione)</span>
        <span style={{ fontSize: 12, opacity: 0.6 }}>WebView · iOS</span>
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <iframe
          src="/?embedded=true&platform=ios&lang=it"
          title="SoKeto Label Analyzer (embedded)"
          style={{ flex: 1, height: "100%", border: "none", background: "#FAF7F2" }}
          allow="camera; microphone"
        />
        <aside
          style={{
            width: 320,
            padding: 16,
            overflow: "auto",
            background: "#0B1220",
            borderLeft: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <h2 style={{ margin: "0 0 8px 0", fontSize: 14, letterSpacing: 1, opacity: 0.7 }}>
            BRIDGE EVENTS
          </h2>
          <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 12 }}>
            Eventi inviati via <code>postMessage</code> al parent frame
          </p>
          {events.length === 0 ? (
            <p style={{ fontSize: 12, opacity: 0.5 }}>
              Nessun evento. Esegui un&apos;analisi nell&apos;iframe per vedere gli eventi qui.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {events.map((e, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 11,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <div style={{ opacity: 0.5, marginBottom: 4 }}>{e.ts}</div>
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    }}
                  >
                    {JSON.stringify(e.payload, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
